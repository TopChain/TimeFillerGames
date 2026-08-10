// Starter engineering content for Release 1 integration testing.
// The Product Plan specifies categories and mechanics, not final launch question copy.
// Replace/expand this bank during content QA before publication.

export type MajorityCategory = 'Classroom' | 'Friends' | 'Family' | 'Workplace' | 'General';

export type MajorityQuestion = {
  id: string;
  category: MajorityCategory;
  prompt: string;
  choices: string[];
};

export const MAJORITY_QUESTIONS: MajorityQuestion[] = [
  { id: 'class-01', category: 'Classroom', prompt: 'Which part of the school day feels shortest?', choices: ['First class', 'Lunch', 'Last class', 'Break'] },
  { id: 'class-02', category: 'Classroom', prompt: 'Which classroom reward would the group choose?', choices: ['Extra break', 'Music time', 'Game time', 'No homework'] },
  { id: 'class-03', category: 'Classroom', prompt: 'Which subject would most people choose for a surprise activity?', choices: ['Science', 'Art', 'Math', 'History'] },
  { id: 'class-04', category: 'Classroom', prompt: 'What is the best way to start a class?', choices: ['Quick game', 'Music', 'Warm-up question', 'Quiet time'] },

  { id: 'friends-01', category: 'Friends', prompt: 'Which plan would this group pick for a free evening?', choices: ['Movie', 'Food', 'Games', 'Go outside'] },
  { id: 'friends-02', category: 'Friends', prompt: 'Which snack disappears first at a hangout?', choices: ['Chips', 'Pizza', 'Fruit', 'Cookies'] },
  { id: 'friends-03', category: 'Friends', prompt: 'Which kind of trip sounds best right now?', choices: ['Beach', 'City', 'Mountains', 'Theme park'] },
  { id: 'friends-04', category: 'Friends', prompt: 'Which message gets the fastest group reply?', choices: ['Food?', 'Game?', 'Where are you?', 'Free tonight?'] },

  { id: 'family-01', category: 'Family', prompt: 'Which family activity would most people choose?', choices: ['Movie night', 'Board game', 'Restaurant', 'Day trip'] },
  { id: 'family-02', category: 'Family', prompt: 'Which meal is most likely to bring everyone to the table?', choices: ['Pizza', 'Tacos', 'Noodles', 'Barbecue'] },
  { id: 'family-03', category: 'Family', prompt: 'Who usually chooses what to watch?', choices: ['Kids', 'Adults', 'Everyone votes', 'Whoever has the remote'] },
  { id: 'family-04', category: 'Family', prompt: 'Which weekend plan sounds easiest to agree on?', choices: ['Stay home', 'Park', 'Shopping', 'Visit relatives'] },

  { id: 'work-01', category: 'Workplace', prompt: 'Which meeting improvement would most people choose?', choices: ['Shorter meetings', 'More breaks', 'Clear agenda', 'More snacks'] },
  { id: 'work-02', category: 'Workplace', prompt: 'Which office perk would win a group vote?', choices: ['Flexible hours', 'Free lunch', 'Remote day', 'Extra vacation'] },
  { id: 'work-03', category: 'Workplace', prompt: 'Which message is most welcome on a Friday?', choices: ['Meeting cancelled', 'Lunch provided', 'Leave early', 'Project approved'] },
  { id: 'work-04', category: 'Workplace', prompt: 'Which team activity sounds least like work?', choices: ['Trivia', 'Lunch out', 'Walk', 'Mini-game'] },

  { id: 'general-01', category: 'General', prompt: 'Which superpower would most people choose?', choices: ['Fly', 'Teleport', 'Read minds', 'Stop time'] },
  { id: 'general-02', category: 'General', prompt: 'Which weather is best for a day off?', choices: ['Sunny', 'Rainy', 'Snowy', 'Cool and cloudy'] },
  { id: 'general-03', category: 'General', prompt: 'Which would most people rather give up for a week?', choices: ['Social media', 'Dessert', 'TV', 'Music'] },
  { id: 'general-04', category: 'General', prompt: 'Which unexpected gift would the room choose?', choices: ['Cash', 'Travel', 'New phone', 'Concert tickets'] },
  { id: 'general-05', category: 'General', prompt: 'Which time of day feels best?', choices: ['Morning', 'Afternoon', 'Evening', 'Late night'] },
  { id: 'general-06', category: 'General', prompt: 'Which place sounds best for a short break?', choices: ['Cafe', 'Park', 'Beach', 'Home'] },
];

export function majorityQuestionsForCategory(category: MajorityCategory) {
  const exact = MAJORITY_QUESTIONS.filter((question) => question.category === category);
  const general = MAJORITY_QUESTIONS.filter((question) => question.category === 'General');
  return category === 'General' ? general : [...exact, ...general];
}
