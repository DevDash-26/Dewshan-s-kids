export const FACULTIES = ['Faculty of Computing', 'Faculty of Business', 'Faculty of Engineering', 'Faculty of Arts & Social Sciences'] as const

export const PROGRAMMES_BY_FACULTY: Record<string, string[]> = {
  'Faculty of Computing': ['BSc Software Engineering', 'BSc Data Science', 'BSc Cybersecurity'],
  'Faculty of Business': ['BBA Management', 'BSc Accounting & Finance', 'BSc Marketing'],
  'Faculty of Engineering': ['BEng Civil Engineering', 'BEng Electrical Engineering', 'BEng Mechanical Engineering'],
  'Faculty of Arts & Social Sciences': ['BA Psychology', 'BA Mass Communication', 'BA English'],
}

export const YEAR_GROUPS = [1, 2, 3, 4] as const
