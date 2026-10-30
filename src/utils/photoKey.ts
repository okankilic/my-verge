// Short stable key for a photo string (URL or data URL), used to attach notes via BucketItem.photoNotes
export function photoKey(src: string): string {
  let hash = 5381;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) + hash + src.charCodeAt(i)) | 0;
  }
  return `p${(hash >>> 0).toString(36)}-${src.length.toString(36)}`;
}
