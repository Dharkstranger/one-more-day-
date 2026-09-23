// Web: save the backup as a download, and read one from a picked file.
import * as DocumentPicker from 'expo-document-picker';

export async function saveBackupFile(filename: string, json: string): Promise<void> {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', multiple: false });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  if (asset.file) return asset.file.text();
  return (await fetch(asset.uri)).text();
}
