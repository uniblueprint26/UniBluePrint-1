export interface ModuleMeta {
  id: number
  name: string
  description: string
  hasQuiz: boolean
}

export const MODULES: ModuleMeta[] = [
  {
    id: 1,
    name: 'What You Are Part Of',
    description: 'Understand the role and responsibility of a Campus Handler.',
    hasQuiz: false,
  },
  {
    id: 2,
    name: 'The Foundation Blueprint Services',
    description: 'Learn every service inside out before you review your first ticket.',
    hasQuiz: true,
  },
  {
    id: 3,
    name: 'The Quality Checklist',
    description: 'Master the five-dimension framework used on every review.',
    hasQuiz: true,
  },
  {
    id: 4,
    name: 'The Ticket Workflow',
    description: 'Learn the exact process from ticket assignment to delivery.',
    hasQuiz: false,
  },
  {
    id: 5,
    name: 'Flagging to Operations',
    description: 'Know when and how to flag, and why it matters.',
    hasQuiz: true,
  },
  {
    id: 6,
    name: 'Being a Campus Handler',
    description: 'The professional and ethical standard of the role.',
    hasQuiz: false,
  },
]

export const getModule = (id: number) => MODULES.find((m) => m.id === id)
