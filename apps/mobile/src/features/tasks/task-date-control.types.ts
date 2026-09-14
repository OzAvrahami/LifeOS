export type TaskDateControlProps = {
  accessibilityLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};
