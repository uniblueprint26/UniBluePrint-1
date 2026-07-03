export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export const QUIZZES: Record<number, QuizQuestion[]> = {
  2: [
    {
      question: 'What is the most common AI failure mode on CV Optimisation?',
      options: ['Generic bullet points', 'Wrong dates', 'Missing skills section', 'Too long'],
      correctIndex: 0,
    },
    {
      question: 'LinkedIn about sections should always be written in which person?',
      options: ['Third person', 'Second person', 'First person', 'Any person'],
      correctIndex: 2,
    },
    {
      question: 'What is the single most common AI failure on Cover Letter Assistance?',
      options: ['Wrong company name', 'Generic opening line', 'Too short', 'Wrong tone'],
      correctIndex: 1,
    },
    {
      question: 'Which STAR component is most commonly missing in Application Form outputs?',
      options: ['Situation', 'Task', 'Action', 'Result'],
      correctIndex: 3,
    },
    {
      question:
        "A CV bullet point reading 'Responsible for managing social media' needs what?",
      options: [
        'Nothing it is fine',
        'To be rewritten with active language and a specific outcome',
        'To be removed',
        'To be moved to skills section',
      ],
      correctIndex: 1,
    },
    {
      question:
        'What should you do if an AI output invents experience the student did not mention?',
      options: [
        'Approve if everything else is good',
        'Edit it yourself',
        'Flag to Operations immediately',
        'Ask the student',
      ],
      correctIndex: 2,
    },
    {
      question:
        'A cover letter that could have been written for any company in any industry fails which dimension?',
      options: ['Accuracy', 'Completeness', 'Tone and Voice', 'All of the above'],
      correctIndex: 3,
    },
    {
      question: 'CAO Personal Statements that open with a famous quote should be?',
      options: [
        'Approved if the quote is relevant',
        'Flagged immediately',
        'Edited by the Handler',
        'Sent back to the student',
      ],
      correctIndex: 1,
    },
    {
      question: 'What does ATS stand for in the context of CV Optimisation?',
      options: [
        'Automated Testing System',
        'Applicant Tracking System',
        'Application Transfer Service',
        'Automated Training Software',
      ],
      correctIndex: 1,
    },
    {
      question:
        'Which service requires knowledge of the difference between MMI and panel interview formats?',
      options: [
        'Interview Preparation',
        'College Interview Preparation',
        'Application Form Assistance',
        'CAO Personal Statement',
      ],
      correctIndex: 1,
    },
  ],
  3: [
    {
      question: 'What are the five quality dimensions?',
      options: [
        'Speed, accuracy, tone, format, length',
        'Accuracy, quality, completeness, tone and voice, deliverability',
        'Clarity, brevity, accuracy, format, relevance',
        'None of the above',
      ],
      correctIndex: 1,
    },
    {
      question: 'What composite score range indicates an excellent output ready to approve?',
      options: ['15-20', '18-25', '21-25', '20-25'],
      correctIndex: 2,
    },
    {
      question:
        'An output scores 23 overall but has an Accuracy score of 1. What do you do?',
      options: [
        'Approve because the composite is high',
        'Flag to Operations regardless of composite',
        'Edit the accuracy issue yourself',
        'Reduce your other scores',
      ],
      correctIndex: 1,
    },
    {
      question: 'The Deliverability dimension asks whether?',
      options: [
        'The output was delivered on time',
        'The student can use the output right now without changing anything',
        'The format is correct',
        'The output was sent to the right student',
      ],
      correctIndex: 1,
    },
    {
      question: 'What composite score triggers an automatic block on the Approve button?',
      options: ['Below 15', 'Below 13', 'Any dimension scored 1', 'Below 10'],
      correctIndex: 2,
    },
    {
      question: 'Tone and Voice scoring asks whether the output sounds like?',
      options: [
        'A professional document',
        'A professional version of this specific student',
        'A corporate communication',
        'An academic paper',
      ],
      correctIndex: 1,
    },
    {
      question:
        'An output has placeholder brackets like [Company Name] still unfilled. Which dimension does this fail?',
      options: ['Accuracy', 'Quality', 'Completeness', 'Deliverability'],
      correctIndex: 3,
    },
    {
      question: 'A composite score of 14 should make you?',
      options: [
        'Approve immediately',
        'Flag immediately',
        'Review carefully and lean toward flagging',
        'Ask Operations first',
      ],
      correctIndex: 2,
    },
    {
      question: 'The Quality dimension asks whether the output is?',
      options: ['Correct', 'Complete', 'Genuinely good', 'Fast'],
      correctIndex: 2,
    },
    {
      question: 'What is the minimum composite score to approve without a confirmation modal?',
      options: ['16', '18', '21', '11'],
      correctIndex: 0,
    },
  ],
  5: [
    {
      question: 'How many flag reasons should you select when multiple apply?',
      options: ['Just the most important one', 'Maximum two', 'All that apply', 'One per ticket'],
      correctIndex: 2,
    },
    {
      question:
        'A student submission contains content suggesting they may be at risk. What do you do?',
      options: [
        'Process the ticket normally',
        'Flag with safeguarding reason and use urgent escalation',
        'Message the student directly',
        'Ignore and complete the ticket',
      ],
      correctIndex: 1,
    },
    {
      question: 'What is the Operations SLA for resolving a Premium flagged ticket?',
      options: ['2 hours', '1 hour', '30 minutes', '4 hours'],
      correctIndex: 2,
    },
    {
      question: 'If Operations rejects your flag what should you do?',
      options: [
        'Refuse to approve',
        'Read their reasoning, learn from it, and approve',
        'Escalate to senior Operations',
        'Flag again',
      ],
      correctIndex: 1,
    },
    {
      question: 'A high flag acceptance rate means?',
      options: [
        'You flag too many tickets',
        'Your quality judgment is well-calibrated with Operations',
        'You are too strict',
        'You are making mistakes',
      ],
      correctIndex: 1,
    },
    {
      question: 'When should you use the Other flag reason?',
      options: ['When no other reason fits', 'Always', 'Never', 'When you are unsure'],
      correctIndex: 0,
    },
    {
      question: 'The minimum word count for an Other flag reason explanation is?',
      options: ['20 words', '100 words', '50 words', 'No minimum'],
      correctIndex: 2,
    },
    {
      question: 'What happens after you flag a ticket?',
      options: [
        'You must follow up with Operations',
        'You are done — Operations handles everything from there',
        'You must edit the output yourself',
        'You must contact the student',
      ],
      correctIndex: 1,
    },
    {
      question: 'Flagging a ticket instead of approving it when unsure is?',
      options: [
        'A sign of weakness',
        'The correct professional decision',
        'Counted against your score',
        'Not allowed on Standard tickets',
      ],
      correctIndex: 1,
    },
    {
      question: 'What does a low flag acceptance rate trigger?',
      options: [
        'Immediate suspension',
        'A calibration conversation with Operations',
        'Removal from the programme',
        'Additional training requirement',
      ],
      correctIndex: 1,
    },
  ],
}
