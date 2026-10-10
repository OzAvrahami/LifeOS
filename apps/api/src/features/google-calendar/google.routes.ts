import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { readGoogleConfig, type GoogleConfig } from './google.config.js';
import { HttpGoogleProvider, type GoogleProvider } from './google.provider.js';
import { googleStore } from './google.store.js';
import { GoogleCalendarService } from './google.service.js';
import { GoogleError, type GoogleStore } from './google.types.js';
export function createGoogleCalendarRouter(options: { auth?:RequestHandler; config?:()=>GoogleConfig|null; store?:GoogleStore; provider?:GoogleProvider }={}) {
  const router=Router();
  const service=()=>{const config=(options.config??readGoogleConfig)(); if(!config)throw new GoogleError(503,'setup_required');
    return new GoogleCalendarService(config,options.store??googleStore(config),options.provider??new HttpGoogleProvider(config));};
  router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');next();});
  router.get('/callback',async(req,res)=>{
    const state=req.query.state;const code=req.query.code;
    if(typeof state!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(state)|| (code!==undefined&&(typeof code!=='string'||code.length>4096)))throw new GoogleError(400,'invalid_attempt');
    res.redirect(303,await service().callback(state,code as string|undefined,req.query.error!==undefined));
  });
  router.use(options.auth??requireAuth);
  router.get('/',async(req,res)=>{
    if(!(options.config??readGoogleConfig)()) {res.json({configured:false,status:'unavailable',calendars:[],readOnly:true});return;}
    res.json(await service().state(req.auth.user.id));
  });
  router.post('/authorize',async(req,res)=>{
    if(!['web','native'].includes(req.body?.platform)||Object.keys(req.body).some(k=>k!=='platform'))throw new GoogleError(400,'invalid_request');
    res.json(await service().begin(req.auth.user.id,req.body.platform));
  });
  const id=(value:unknown)=>{if(typeof value!=='string'||! /^[0-9a-f-]{36}$/i.test(value))throw new GoogleError(400,'invalid_request');return value;};
  router.post('/complete',async(req,res)=>{
    const attempt=id(req.body?.id);const proof=req.body?.proof; const receipt=req.body?.receipt;
    if(typeof receipt!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(receipt)||typeof proof!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(proof))throw new GoogleError(400,'invalid_request');
    res.json(await service().complete(req.auth.user.id,attempt,proof,receipt));
  });
  router.post('/cancel',async(req,res)=>res.json(await service().cancel(req.auth.user.id,id(req.body?.id))));
  router.post('/disconnect',async(req,res)=>res.json(await service().disconnect(req.auth.user.id)));
  router.get('/calendars',async(req,res)=>res.json(await service().calendars(req.auth.user.id)));
  const revision=(value:unknown)=>{if(!Number.isSafeInteger(value)||Number(value)<0)throw new GoogleError(400,'invalid_request');return Number(value);};
  router.put('/selection',async(req,res)=>{
    const ids=req.body?.ids;
    if(!Array.isArray(ids)||ids.length>10||ids.some(x=>typeof x!=='string'||x.length>1024)||new Set(ids).size!==ids.length)throw new GoogleError(400,'invalid_request');
    res.json(await service().select(req.auth.user.id,ids,revision(req.body?.revision)));
  });
  router.post('/import',async(req,res)=>{
    const {data,error}=await req.auth.supabase.from('user_settings').select('timezone').eq('user_id',req.auth.user.id).maybeSingle();
    if(error)throw new GoogleError(503,'settings_unavailable');
    res.json(await service().sync(req.auth.user.id,revision(req.body?.revision),data?.timezone??'Asia/Jerusalem'));
  });
  router.use(((error:unknown,_req,res,next)=>{if(error instanceof GoogleError)res.status(error.statusCode).json({error:error.code});else next(error);}) as import('express').ErrorRequestHandler);
  return router;
}
export const googleCalendarRouter=createGoogleCalendarRouter();
