import type { QuestionnaireAnswers, Risk } from '../types';
import { riskTemplates } from '../data/riskTemplates';

const MODULE_QUESTION: Record<string, keyof QuestionnaireAnswers | 'always'> = {
  '00 DESIGN & DEVELOPMENT': 'q1',
  '01 STRUCTURED DATA': 'q2',
  '02 CHATBOT UI': 'q3',
  '03 SPEECH CAPTURE': 'q4',
  '04 IMAGE CLASSIFICATION': 'q5',
  '50 GENERAL LLMs': 'q6',
  '51 REMOTE LLMs': 'q7',
  '52 RETRIEVAL': 'q8',
  '53 SUMMARISATION': 'q9',
  '54 AGENTIC': 'q10',
  '98 LIVE VERIFICATION': 'always',
  '99 LIVE PERFORMANCE': 'always',
};

const ELEMENT_NAMES: Record<string, string[]> = {
  '00 DESIGN & DEVELOPMENT': ['System 1', 'System 2', 'System 3'],
  '01 STRUCTURED DATA': ['Structured Data Function 1', 'Structured Data Function 2'],
  '02 CHATBOT UI': ['Chatbot Interface 1', 'Chatbot Interface 2'],
  '03 SPEECH CAPTURE': ['Speech Capture Function 1', 'Speech Capture Function 2'],
  '04 IMAGE CLASSIFICATION': ['Image Classification Function 1', 'Image Classification Function 2'],
  '50 GENERAL LLMs': ['LLM 1', 'LLM 2'],
  '51 REMOTE LLMs': ['Remote LLM 1', 'Remote LLM 2'],
  '52 RETRIEVAL': ['Retrieval Function 1', 'Retrieval Function 2'],
  '53 SUMMARISATION': ['Summarisation Function 1', 'Summarisation Function 2'],
  '54 AGENTIC': ['Agentic System'],
  '98 LIVE VERIFICATION': ['Whole Product'],
  '99 LIVE PERFORMANCE': ['Whole Product'],
};

export function buildRiskLog(answers: QuestionnaireAnswers, existingRisks: Risk[] = []): Risk[] {
  const existingMap = new Map(existingRisks.map(r => [r.id, r]));
  const risks: Risk[] = [];

  const templatesByModule = new Map<string, typeof riskTemplates>();
  for (const tmpl of riskTemplates) {
    if (!templatesByModule.has(tmpl.riskModule)) templatesByModule.set(tmpl.riskModule, []);
    templatesByModule.get(tmpl.riskModule)!.push(tmpl);
  }

  const moduleOrder = Object.keys(MODULE_QUESTION);
  for (const module of moduleOrder) {
    const templates = templatesByModule.get(module) ?? [];
    const qKey = MODULE_QUESTION[module];
    const count = qKey === 'always' ? 1 : (answers[qKey as keyof QuestionnaireAnswers] as number);
    const elementNames = ELEMENT_NAMES[module] ?? [];

    for (let instance = 1; instance <= count; instance++) {
      const systemElement = elementNames[instance - 1] ?? `Instance ${instance}`;
      for (const tmpl of templates) {
        const riskId = instance === 1 ? tmpl.id : tmpl.id.replace('-1-', `-${instance}-`);
        const existing = existingMap.get(riskId);
        risks.push({
          id: riskId,
          templateId: tmpl.id,
          riskArea: tmpl.riskArea,
          riskModule: tmpl.riskModule,
          systemElement: existing?.systemElement ?? systemElement,
          riskTitle: tmpl.riskTitle,
          unwantedEffect: tmpl.unwantedEffect,
          cause: tmpl.cause,
          proposedMitigations: tmpl.proposedMitigations,
          impactScore: existing?.impactScore ?? null,
          preMitigationLikelihood: existing?.preMitigationLikelihood ?? null,
          mitigationsInPlace: existing?.mitigationsInPlace ?? '',
          mitigationReview: existing?.mitigationReview ?? '',
          postMitigationLikelihood: existing?.postMitigationLikelihood ?? null,
          inScope: existing?.inScope ?? 'Y',
          mitigated: existing?.mitigated ?? 'N',
          assuranceComplete: existing?.assuranceComplete ?? 'N',
          status: existing?.status ?? 'Open',
        });
      }
    }
  }

  return risks;
}
