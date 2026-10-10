import { randomUUID } from 'node:crypto';
import { digest, nonce, seal, unseal, type GoogleConfig } from './google.config.js';
import type { GoogleProvider } from './google.provider.js';
import { GoogleError, type GoogleState, type GoogleStore, type ImportedEvent } from './google.types.js';
import { importWindow, normalizeGoogleEvent } from './google.import.js';
export function publicGoogleState(s: GoogleState) {
  return { configured: true, status: s.status, revision: s.revision, email: s.status === 'disconnected' ? null : s.email ?? null,
    calendars: s.calendars, lastSyncAt: s.lastSyncAt ?? null, importing: Boolean(s.lock && Date.parse(s.lock.expiresAt) > Date.now()),
    window: importWindow(), readOnly: true };
}
export class GoogleCalendarService {
  constructor(private config: GoogleConfig, private store: GoogleStore, private provider: GoogleProvider) {}
  async state(user: string) { return publicGoogleState(await this.store.command(user, 'read')); }
  async begin(user: string, platform: 'web' | 'native') {
    const returnUri = platform === 'web' ? this.config.webReturn : this.config.nativeReturn;
    if (!returnUri) throw new GoogleError(503, 'setup_required');
    const state = nonce(); const proof = nonce(); const verifier = nonce(); const id = randomUUID();
    await this.store.command(user, 'begin', { id, stateHash: digest(state), proofHash: digest(proof), verifier: seal(verifier,user,'pkce',this.config.key),
      returnUri, expiresAt: new Date(Date.now()+600000).toISOString() });
    return { id, proof, authorizationUrl: this.provider.authorize(state, verifier) };
  }
  async callback(state: string, code?: string, denied = false) {
    const s = await this.store.command(null, 'consume', { stateHash: digest(state) });
    const a = s.attempt!; const user = s.userId!;
    const target = new URL(a.returnUri); target.searchParams.set('attempt',a.id);
    try {
      if (denied || !code) throw new GoogleError(400,'authorization_cancelled');
      const token = await this.provider.exchange(code, unseal(a.verifier,user,'pkce',this.config.key));
      const receipt = nonce();
      await this.store.command(user,'pending',{ receiptHash:digest(receipt), id:a.id, accountId:token.accountId, email:token.email,
        credential:seal(token.refreshToken,user,'refresh',this.config.key) });
      target.searchParams.set('receipt',receipt); target.searchParams.set('result','ready');
    } catch {
      await this.store.command(user,'cancel',{id:a.id}); target.searchParams.set('result',denied?'cancelled':'failed');
    }
    return target.href;
  }
  async complete(user: string, id: string, proof: string, receipt: string) {
    return publicGoogleState(await this.store.command(user,'finish',{id,proofHash:digest(proof),receiptHash:digest(receipt)}));
  }
  async cancel(user: string, id: string) { return publicGoogleState(await this.store.command(user,'cancel',{id})); }
  async disconnect(user: string) { return publicGoogleState(await this.store.command(user,'disconnect')); }
  private access(user: string,s: GoogleState) {
    if (!s.credential || !s.accountId || s.status==='disconnected' || s.status==='reconnect_required') throw new GoogleError(409,'reconnect_required');
    return this.provider.refresh(unseal(s.credential,user,'refresh',this.config.key));
  }
  async calendars(user: string) {
    const s = await this.store.command(user,'read');
    try {
      const calendars = await this.provider.calendars(await this.access(user,s));
      return publicGoogleState(await this.store.command(user,'catalog',{revision:s.revision,calendars}));
    } catch (error) {
      if (s.status !== 'disconnected') await this.store.command(user,'fail',{revision:s.revision,lockId:null,status:error instanceof GoogleError && error.code==='reconnect_required'?'reconnect_required':'failed'}).catch(()=>undefined);
      throw error;
    }
  }
  async select(user: string, ids: string[], revision: number) {
    return publicGoogleState(await this.store.command(user,'select',{ids,revision}));
  }
  async sync(user: string, revision: number, timezone: string) {
    const lockId=randomUUID(); const deadline = Date.now() + 120_000;
    const s=await this.store.command(user,'claim',{revision,lock:{id:lockId,expiresAt:new Date(Date.now()+300000).toISOString()}});
    try {
      const access=await this.access(user,s); const window=importWindow(); const events: ImportedEvent[]=[];
      const selected=s.calendars.filter(c=>c.selected);
      // Revalidate permissions on every run, not just when the selection page opened.
      const catalog=await this.provider.calendars(access);
      for (const calendar of selected) {
        if (Date.now() > deadline) throw new GoogleError(502, 'provider_timeout');
        const current=catalog.find(c=>c.id===calendar.id && ['reader','writer','owner'].includes(c.accessRole));
        if (!current) throw new GoogleError(409,'calendar_permission_denied');
        const seen=new Set<string>();
        for (const event of await this.provider.events(access,calendar.id,window.from,window.to)) {
          if (seen.has(event.id)) throw new GoogleError(502,'duplicate_provider_page');
          seen.add(event.id); const mapped=normalizeGoogleEvent(event,current,s.accountId!,timezone); if(mapped)events.push(mapped);
          if(events.length>10000)throw new GoogleError(422,'import_limit');
        }
      }
      if (Date.now() > deadline) throw new GoogleError(502, 'provider_timeout');
      const result=await this.store.command(user,'apply',{revision,lockId,events,
        dateFrom:new Intl.DateTimeFormat('en-CA',{timeZone:timezone}).format(new Date(window.from)),
        dateTo:new Intl.DateTimeFormat('en-CA',{timeZone:timezone}).format(new Date(Date.parse(window.to)-1))});
      return publicGoogleState(result);
    } catch(error) {
      await this.store.command(user,'fail',{revision,lockId,status:error instanceof GoogleError&&error.code==='reconnect_required'?'reconnect_required':'failed'}).catch(()=>undefined);
      throw error;
    }
  }
}
