// Release 1 curated starter bank.
// Prompts are intentionally low-stakes and avoid politics, protected-trait targeting,
// health/financial disclosures, humiliation, romance/sexual content, and other sensitive topics.

export type MajorityCategory = 'Classroom' | 'Friends' | 'Family' | 'Workplace' | 'General';

export type MajorityQuestion = {
  id: string;
  category: MajorityCategory;
  prompt: string;
  choices: string[];
};

export const MAJORITY_QUESTIONS: MajorityQuestion[] = [
  { id: 'class-01', category: 'Classroom', prompt: 'Which part of the school day feels shortest?', choices: ['First class', 'Lunch', 'Last class', 'Break'] },
  { id: 'class-02', category: 'Classroom', prompt: 'Which surprise class activity would the room choose?', choices: ['Science demo', 'Art challenge', 'Trivia', 'Mini-game'] },
  { id: 'class-03', category: 'Classroom', prompt: 'What is the best way to start a class?', choices: ['Quick game', 'Music', 'Warm-up question', 'Quiet reading'] },
  { id: 'class-04', category: 'Classroom', prompt: 'Which review activity would most people choose?', choices: ['Team quiz', 'Flash cards', 'Practice round', 'Teach a partner'] },
  { id: 'class-05', category: 'Classroom', prompt: 'Which project format sounds most fun?', choices: ['Poster', 'Slides', 'Short video', 'Live demo'] },
  { id: 'class-06', category: 'Classroom', prompt: 'Which short break would the group prefer?', choices: ['Stretch', 'Walk', 'Music', 'Quick puzzle'] },
  { id: 'class-07', category: 'Classroom', prompt: 'Which group-work setup would the room choose?', choices: ['Pairs', 'Groups of three', 'Groups of four', 'Whole class'] },
  { id: 'class-08', category: 'Classroom', prompt: 'Which background sound works best for quiet work?', choices: ['Silence', 'Soft music', 'Nature sounds', 'Low conversation'] },
  { id: 'class-09', category: 'Classroom', prompt: 'Which class celebration sounds best?', choices: ['Game round', 'Snack break', 'Music break', 'Photo moment'] },
  { id: 'class-10', category: 'Classroom', prompt: 'Which school event would most people attend first?', choices: ['Sports game', 'Talent show', 'Club fair', 'Movie night'] },

  { id: 'friends-01', category: 'Friends', prompt: 'Which plan would this group pick for a free evening?', choices: ['Movie', 'Food', 'Games', 'Go outside'] },
  { id: 'friends-02', category: 'Friends', prompt: 'Which snack disappears first at a hangout?', choices: ['Chips', 'Pizza', 'Fruit', 'Cookies'] },
  { id: 'friends-03', category: 'Friends', prompt: 'Which kind of trip sounds best right now?', choices: ['Beach', 'City', 'Mountains', 'Theme park'] },
  { id: 'friends-04', category: 'Friends', prompt: 'Which message gets the fastest group reply?', choices: ['Food?', 'Game?', 'Movie?', 'Free tonight?'] },
  { id: 'friends-05', category: 'Friends', prompt: 'What is the best rainy-day plan?', choices: ['Movie marathon', 'Board games', 'Cook together', 'Cafe visit'] },
  { id: 'friends-06', category: 'Friends', prompt: 'Which playlist would the group choose first?', choices: ['Upbeat', 'Throwbacks', 'Chill', 'Mixed shuffle'] },
  { id: 'friends-07', category: 'Friends', prompt: 'Which game-night style sounds best?', choices: ['Trivia', 'Drawing', 'Cards', 'Co-op game'] },
  { id: 'friends-08', category: 'Friends', prompt: 'Which shared meal would be easiest to agree on?', choices: ['Pizza', 'Tacos', 'Noodles', 'Sandwiches'] },
  { id: 'friends-09', category: 'Friends', prompt: 'Which spontaneous plan would the group choose?', choices: ['Dessert run', 'Park walk', 'Photo stop', 'Arcade'] },
  { id: 'friends-10', category: 'Friends', prompt: 'Which place is best for a long conversation?', choices: ['Cafe', 'Park', 'Living room', 'Food court'] },

  { id: 'family-01', category: 'Family', prompt: 'Which family activity would most people choose?', choices: ['Movie night', 'Board game', 'Restaurant', 'Day trip'] },
  { id: 'family-02', category: 'Family', prompt: 'Which meal is most likely to bring everyone to the table?', choices: ['Pizza', 'Tacos', 'Noodles', 'Barbecue'] },
  { id: 'family-03', category: 'Family', prompt: 'Which weekend outing sounds easiest to agree on?', choices: ['Park', 'Museum', 'Shopping', 'Scenic drive'] },
  { id: 'family-04', category: 'Family', prompt: 'Which dessert would disappear first?', choices: ['Ice cream', 'Cake', 'Cookies', 'Fruit'] },
  { id: 'family-05', category: 'Family', prompt: 'Which rainy-day activity sounds best?', choices: ['Movie', 'Puzzle', 'Cooking', 'Indoor game'] },
  { id: 'family-06', category: 'Family', prompt: 'Which road-trip stop would the group choose?', choices: ['Viewpoint', 'Snack stop', 'Park', 'Local attraction'] },
  { id: 'family-07', category: 'Family', prompt: 'Which breakfast would win a family vote?', choices: ['Pancakes', 'Eggs', 'Cereal', 'Fruit and yogurt'] },
  { id: 'family-08', category: 'Family', prompt: 'Which at-home activity sounds most relaxing?', choices: ['Music', 'Reading', 'Movie', 'Game'] },
  { id: 'family-09', category: 'Family', prompt: 'Which celebration activity would the group pick?', choices: ['Special meal', 'Games', 'Photos', 'Day outing'] },
  { id: 'family-10', category: 'Family', prompt: 'How should the next movie be chosen?', choices: ['Everyone votes', 'Take turns', 'Random pick', 'Choose a theme'] },

  { id: 'work-01', category: 'Workplace', prompt: 'Which meeting improvement would most people choose?', choices: ['Shorter meetings', 'Clear agenda', 'More breaks', 'More visuals'] },
  { id: 'work-02', category: 'Workplace', prompt: 'Which team break sounds best?', choices: ['Coffee', 'Short walk', 'Snack', 'Quick game'] },
  { id: 'work-03', category: 'Workplace', prompt: 'Which team lunch would be easiest to agree on?', choices: ['Sandwiches', 'Tacos', 'Noodles', 'Pizza'] },
  { id: 'work-04', category: 'Workplace', prompt: 'Which team activity sounds least like work?', choices: ['Trivia', 'Lunch out', 'Walk', 'Mini-game'] },
  { id: 'work-05', category: 'Workplace', prompt: 'Which Friday message is most welcome?', choices: ['Meeting cancelled', 'Lunch provided', 'Project approved', 'Early wrap-up'] },
  { id: 'work-06', category: 'Workplace', prompt: 'Which focus environment would the team choose?', choices: ['Quiet room', 'Soft music', 'Cafe-style buzz', 'Headphones'] },
  { id: 'work-07', category: 'Workplace', prompt: 'Which brainstorming format sounds best?', choices: ['Sticky notes', 'Whiteboard', 'Small groups', 'Silent ideas first'] },
  { id: 'work-08', category: 'Workplace', prompt: 'Which project kickoff is most useful?', choices: ['Clear checklist', 'Short demo', 'Team discussion', 'Example outcome'] },
  { id: 'work-09', category: 'Workplace', prompt: 'Which small team celebration sounds best?', choices: ['Shared lunch', 'Coffee break', 'Game round', 'Group photo'] },
  { id: 'work-10', category: 'Workplace', prompt: 'Which update format is easiest to follow?', choices: ['Short message', 'Checklist', 'Quick meeting', 'Visual board'] },

  { id: 'general-01', category: 'General', prompt: 'Which superpower would most people choose?', choices: ['Fly', 'Teleport', 'Pause time', 'Breathe underwater'] },
  { id: 'general-02', category: 'General', prompt: 'Which weather is best for a day off?', choices: ['Sunny', 'Rainy', 'Snowy', 'Cool and cloudy'] },
  { id: 'general-03', category: 'General', prompt: 'Which time of day feels best?', choices: ['Morning', 'Afternoon', 'Evening', 'Late night'] },
  { id: 'general-04', category: 'General', prompt: 'Which place sounds best for a short break?', choices: ['Cafe', 'Park', 'Beach', 'Home'] },
  { id: 'general-05', category: 'General', prompt: 'Which dessert would most people pick first?', choices: ['Ice cream', 'Cake', 'Cookies', 'Fruit'] },
  { id: 'general-06', category: 'General', prompt: 'Which kind of weekend trip sounds best?', choices: ['Beach', 'City', 'Mountains', 'Small town'] },
  { id: 'general-07', category: 'General', prompt: 'Which way is best to spend a spare hour?', choices: ['Walk', 'Watch something', 'Play a game', 'Take a nap'] },
  { id: 'general-08', category: 'General', prompt: 'Which season has the best atmosphere?', choices: ['Spring', 'Summer', 'Autumn', 'Winter'] },
  { id: 'general-09', category: 'General', prompt: 'Which casual activity sounds most fun?', choices: ['Mini golf', 'Bowling', 'Picnic', 'Arcade'] },
  { id: 'general-10', category: 'General', prompt: 'Which snack style wins a group vote?', choices: ['Salty', 'Sweet', 'Fresh', 'Crunchy'] },
];

export function majorityQuestionsForCategory(category: MajorityCategory) {
  const exact = MAJORITY_QUESTIONS.filter((question) => question.category === category);
  const general = MAJORITY_QUESTIONS.filter((question) => question.category === 'General');
  return category === 'General' ? general : [...exact, ...general];
}
