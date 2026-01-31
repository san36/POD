
export interface ProcessingResult {
  originalImage: string;
  templateImage: string;
  description: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
