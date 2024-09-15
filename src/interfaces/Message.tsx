export default interface Message {
  text: string;
  sent: Date | string;
  from: string;
  to: string;
  attachments: { name: string, path:string|null }[] | null; // Update to match your usage
}
