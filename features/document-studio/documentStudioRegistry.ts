export type DocumentStudioTool = {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
};

export const DOCUMENT_STUDIO_TOOLS: DocumentStudioTool[] = [
  {
    id: 'document-creator',
    title: 'Document Creator',
    description: 'Create a new document with title, rich text content and export options.',
    route: '/document-creator',
    icon: 'file-plus',
  },
  {
    id: 'document-scanner',
    title: 'Document Scanner',
    description: 'Scan paper documents with the camera, capture pages and save a PDF.',
    route: '/document-scanner',
    icon: 'camera',
  },
];
