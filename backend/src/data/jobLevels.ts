export const JOB_LEVELS = [
  "Chairman", "Deputy", "Advisor", "Expert", "Assistant",
  "Deputy Assistant", "General Manager", "Assistant General Manager",
  "Level 1", "Level 2", "Level 3",
] as const;

export type JobLevel = typeof JOB_LEVELS[number];

export const JOB_LEVEL_SET: ReadonlySet<string> = new Set(JOB_LEVELS);

/** Maps Active Directory's Arabic `title` attribute to this app's job_level categories. */
export const ARABIC_TITLE_TO_JOB_LEVEL: Readonly<Record<string, JobLevel>> = {
  "رئيس مجلس الإدارة": "Chairman",
  "نائب": "Deputy",
  "مستشار": "Advisor",
  "خبير": "Expert",
  "مساعد": "Assistant",
  "مساعد نائب": "Deputy Assistant",
  "مدير عام": "General Manager",
  "مدير عام مساعد": "Assistant General Manager",
  "المستوى الأول": "Level 1",
  "المستوى الثاني": "Level 2",
  "المستوى الثالث": "Level 3",
};
