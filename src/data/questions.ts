export interface Question {
  number: number;
  key: string;
  text: string;
  guidance: string;
  module: string;
  min: number;
  max: number;
  mandatory: boolean;
}

export const questions: Question[] = [
  {
    number: 1,
    key: 'q1',
    text: 'How many distinct systems does the product use?',
    guidance: 'For example, a front-end product using an LLM in the background would count as 2. This module must always be selected at least once.',
    module: '00 DESIGN & DEVELOPMENT',
    min: 1,
    max: 3,
    mandatory: true,
  },
  {
    number: 2,
    key: 'q2',
    text: 'How many distinct functions within the product analyse structured data?',
    guidance: 'For example, functionality that analyses tables of numbers or codes. Usually 0 or 1.',
    module: '01 STRUCTURED DATA',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 3,
    key: 'q3',
    text: 'How many distinct functions within the product converse with the user via text?',
    guidance: 'For example, chatbot-like interfaces. Usually 0 or 1.',
    module: '02 CHATBOT UI',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 4,
    key: 'q4',
    text: 'How many distinct functions within the product capture and process speech?',
    guidance: 'For example, transcription tools or Ambient Voice Technology (AVT). Usually 0 or 1.',
    module: '03 SPEECH CAPTURE',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 5,
    key: 'q5',
    text: 'How many distinct functions within the product process and/or classify images?',
    guidance: 'For example, functionality suggesting diagnoses from X-Rays or CT scans. Usually 0 or 1.',
    module: '04 IMAGE CLASSIFICATION',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 6,
    key: 'q6',
    text: 'How many distinct Large Language Models are used by the product?',
    guidance: "For example, powerful AIs that can interpret human language, sometimes hosted locally, sometimes accessed via online subscription. Usually 0 or 1.",
    module: '50 GENERAL LLMs',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 7,
    key: 'q7',
    text: 'How many Large Language Models used by the product are remote?',
    guidance: 'For example, LLMs accessed online via subscription not under direct developer control (e.g. ChatGPT). Usually 0 or 1.',
    module: '51 REMOTE LLMs',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 8,
    key: 'q8',
    text: 'How many distinct functions within the product gather information from data assets?',
    guidance: 'For example, functionality gathering clinical patient notes from electronic records. Usually 0 or 1.',
    module: '52 RETRIEVAL',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 9,
    key: 'q9',
    text: 'How many distinct functions within the product summarise data?',
    guidance: 'For example, functionality generating an overview of a larger volume of complex information. Usually 0 or 1.',
    module: '53 SUMMARISATION',
    min: 0,
    max: 2,
    mandatory: false,
  },
  {
    number: 10,
    key: 'q10',
    text: 'Does the product use any form of agentic AI or similar?',
    guidance: 'For example, products consisting of several separate AIs each working relatively independently. Either 0 or 1.',
    module: '54 AGENTIC',
    min: 0,
    max: 1,
    mandatory: false,
  },
];

export const mandatoryModules = [
  { module: '98 LIVE VERIFICATION', label: 'Live Verification (mandatory)', risks: 13 },
  { module: '99 LIVE PERFORMANCE', label: 'Live Performance (mandatory)', risks: 11 },
];

export const risksPerModule: Record<string, number> = {
  '00 DESIGN & DEVELOPMENT': 21,
  '01 STRUCTURED DATA': 8,
  '02 CHATBOT UI': 13,
  '03 SPEECH CAPTURE': 12,
  '04 IMAGE CLASSIFICATION': 10,
  '50 GENERAL LLMs': 14,
  '51 REMOTE LLMs': 7,
  '52 RETRIEVAL': 7,
  '53 SUMMARISATION': 10,
  '54 AGENTIC': 9,
  '98 LIVE VERIFICATION': 13,
  '99 LIVE PERFORMANCE': 11,
};
