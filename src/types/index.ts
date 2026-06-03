export type RiskArea = 'Design' | 'Data' | 'Development' | 'Deployment' | 'Due Diligence';
export type InScope = 'Y' | 'N';
export type MitigatedStatus = 'Y' | 'P' | 'N';
export type AssuranceStatus = 'Y' | 'N';
export type RiskStatus = 'Open' | 'Closed';

export interface RiskTemplate {
  id: string;
  riskArea: string;
  riskModule: string;
  riskTitle: string;
  unwantedEffect: string;
  cause: string;
  proposedMitigations: string;
}

export interface Risk {
  id: string;
  templateId: string;
  riskArea: string;
  riskModule: string;
  systemElement: string;
  riskTitle: string;
  unwantedEffect: string;
  cause: string;
  proposedMitigations: string;
  impactScore: number | null;
  preMitigationLikelihood: number | null;
  mitigationsInPlace: string;
  mitigationReview: string;
  postMitigationLikelihood: number | null;
  inScope: InScope;
  mitigated: MitigatedStatus;
  assuranceComplete: AssuranceStatus;
  status: RiskStatus;
}

export interface QuestionnaireAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
}

export interface Project {
  id: string;
  name: string;
  organisation: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  questionnaire: QuestionnaireAnswers;
  risks: Risk[];
}
