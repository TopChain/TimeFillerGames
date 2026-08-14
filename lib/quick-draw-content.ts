// Curated Release 1 launch vocabulary.
// Words are intentionally concrete, drawable, non-sensitive, and suitable for mixed-age groups.
// Difficulty reflects drawing/recognition complexity rather than reading level.

export type QuickDrawCategory = 'Everyday' | 'Animals' | 'Food' | 'Places';
export type QuickDrawDifficulty = 'easy' | 'medium' | 'hard';

export type QuickDrawWord = {
  id: string;
  category: QuickDrawCategory;
  difficulty: QuickDrawDifficulty;
  word: string;
};

export const QUICK_DRAW_WORDS: QuickDrawWord[] = [
  // Everyday — easy
  { id:'ee01', category:'Everyday', difficulty:'easy', word:'key' },
  { id:'ee02', category:'Everyday', difficulty:'easy', word:'umbrella' },
  { id:'ee03', category:'Everyday', difficulty:'easy', word:'bicycle' },
  { id:'ee04', category:'Everyday', difficulty:'easy', word:'chair' },
  { id:'ee05', category:'Everyday', difficulty:'easy', word:'clock' },
  { id:'ee06', category:'Everyday', difficulty:'easy', word:'book' },
  { id:'ee07', category:'Everyday', difficulty:'easy', word:'phone' },
  { id:'ee08', category:'Everyday', difficulty:'easy', word:'shoe' },
  { id:'ee09', category:'Everyday', difficulty:'easy', word:'backpack' },
  { id:'ee10', category:'Everyday', difficulty:'easy', word:'cup' },
  { id:'ee11', category:'Everyday', difficulty:'easy', word:'lamp' },
  { id:'ee12', category:'Everyday', difficulty:'easy', word:'pencil' },
  // Everyday — medium
  { id:'em01', category:'Everyday', difficulty:'medium', word:'headphones' },
  { id:'em02', category:'Everyday', difficulty:'medium', word:'flashlight' },
  { id:'em03', category:'Everyday', difficulty:'medium', word:'camera' },
  { id:'em04', category:'Everyday', difficulty:'medium', word:'toothbrush' },
  { id:'em05', category:'Everyday', difficulty:'medium', word:'suitcase' },
  { id:'em06', category:'Everyday', difficulty:'medium', word:'calculator' },
  { id:'em07', category:'Everyday', difficulty:'medium', word:'scissors' },
  { id:'em08', category:'Everyday', difficulty:'medium', word:'watering can' },
  { id:'em09', category:'Everyday', difficulty:'medium', word:'alarm clock' },
  { id:'em10', category:'Everyday', difficulty:'medium', word:'skateboard' },
  { id:'em11', category:'Everyday', difficulty:'medium', word:'paintbrush' },
  { id:'em12', category:'Everyday', difficulty:'medium', word:'shopping cart' },
  // Everyday — hard
  { id:'eh01', category:'Everyday', difficulty:'hard', word:'hourglass' },
  { id:'eh02', category:'Everyday', difficulty:'hard', word:'telescope' },
  { id:'eh03', category:'Everyday', difficulty:'hard', word:'typewriter' },
  { id:'eh04', category:'Everyday', difficulty:'hard', word:'microscope' },
  { id:'eh05', category:'Everyday', difficulty:'hard', word:'fire extinguisher' },
  { id:'eh06', category:'Everyday', difficulty:'hard', word:'vacuum cleaner' },
  { id:'eh07', category:'Everyday', difficulty:'hard', word:'sewing machine' },
  { id:'eh08', category:'Everyday', difficulty:'hard', word:'wheelbarrow' },
  { id:'eh09', category:'Everyday', difficulty:'hard', word:'binoculars' },
  { id:'eh10', category:'Everyday', difficulty:'hard', word:'thermometer' },
  { id:'eh11', category:'Everyday', difficulty:'hard', word:'coffee maker' },
  { id:'eh12', category:'Everyday', difficulty:'hard', word:'traffic light' },

  // Animals — easy
  { id:'ae01', category:'Animals', difficulty:'easy', word:'cat' },
  { id:'ae02', category:'Animals', difficulty:'easy', word:'dog' },
  { id:'ae03', category:'Animals', difficulty:'easy', word:'fish' },
  { id:'ae04', category:'Animals', difficulty:'easy', word:'bird' },
  { id:'ae05', category:'Animals', difficulty:'easy', word:'rabbit' },
  { id:'ae06', category:'Animals', difficulty:'easy', word:'elephant' },
  { id:'ae07', category:'Animals', difficulty:'easy', word:'lion' },
  { id:'ae08', category:'Animals', difficulty:'easy', word:'turtle' },
  { id:'ae09', category:'Animals', difficulty:'easy', word:'duck' },
  { id:'ae10', category:'Animals', difficulty:'easy', word:'horse' },
  { id:'ae11', category:'Animals', difficulty:'easy', word:'butterfly' },
  { id:'ae12', category:'Animals', difficulty:'easy', word:'frog' },
  // Animals — medium
  { id:'am01', category:'Animals', difficulty:'medium', word:'penguin' },
  { id:'am02', category:'Animals', difficulty:'medium', word:'octopus' },
  { id:'am03', category:'Animals', difficulty:'medium', word:'giraffe' },
  { id:'am04', category:'Animals', difficulty:'medium', word:'kangaroo' },
  { id:'am05', category:'Animals', difficulty:'medium', word:'flamingo' },
  { id:'am06', category:'Animals', difficulty:'medium', word:'raccoon' },
  { id:'am07', category:'Animals', difficulty:'medium', word:'peacock' },
  { id:'am08', category:'Animals', difficulty:'medium', word:'dolphin' },
  { id:'am09', category:'Animals', difficulty:'medium', word:'hedgehog' },
  { id:'am10', category:'Animals', difficulty:'medium', word:'crocodile' },
  { id:'am11', category:'Animals', difficulty:'medium', word:'squirrel' },
  { id:'am12', category:'Animals', difficulty:'medium', word:'seahorse' },
  // Animals — hard
  { id:'ah01', category:'Animals', difficulty:'hard', word:'chameleon' },
  { id:'ah02', category:'Animals', difficulty:'hard', word:'porcupine' },
  { id:'ah03', category:'Animals', difficulty:'hard', word:'platypus' },
  { id:'ah04', category:'Animals', difficulty:'hard', word:'armadillo' },
  { id:'ah05', category:'Animals', difficulty:'hard', word:'woodpecker' },
  { id:'ah06', category:'Animals', difficulty:'hard', word:'hermit crab' },
  { id:'ah07', category:'Animals', difficulty:'hard', word:'praying mantis' },
  { id:'ah08', category:'Animals', difficulty:'hard', word:'swordfish' },
  { id:'ah09', category:'Animals', difficulty:'hard', word:'rhinoceros' },
  { id:'ah10', category:'Animals', difficulty:'hard', word:'orangutan' },
  { id:'ah11', category:'Animals', difficulty:'hard', word:'starfish' },
  { id:'ah12', category:'Animals', difficulty:'hard', word:'pelican' },

  // Food — easy
  { id:'fe01', category:'Food', difficulty:'easy', word:'pizza' },
  { id:'fe02', category:'Food', difficulty:'easy', word:'banana' },
  { id:'fe03', category:'Food', difficulty:'easy', word:'apple' },
  { id:'fe04', category:'Food', difficulty:'easy', word:'ice cream' },
  { id:'fe05', category:'Food', difficulty:'easy', word:'cookie' },
  { id:'fe06', category:'Food', difficulty:'easy', word:'egg' },
  { id:'fe07', category:'Food', difficulty:'easy', word:'carrot' },
  { id:'fe08', category:'Food', difficulty:'easy', word:'donut' },
  { id:'fe09', category:'Food', difficulty:'easy', word:'watermelon' },
  { id:'fe10', category:'Food', difficulty:'easy', word:'bread' },
  { id:'fe11', category:'Food', difficulty:'easy', word:'cheese' },
  { id:'fe12', category:'Food', difficulty:'easy', word:'taco' },
  // Food — medium
  { id:'fm01', category:'Food', difficulty:'medium', word:'cupcake' },
  { id:'fm02', category:'Food', difficulty:'medium', word:'sandwich' },
  { id:'fm03', category:'Food', difficulty:'medium', word:'pancakes' },
  { id:'fm04', category:'Food', difficulty:'medium', word:'popcorn' },
  { id:'fm05', category:'Food', difficulty:'medium', word:'sushi' },
  { id:'fm06', category:'Food', difficulty:'medium', word:'hot dog' },
  { id:'fm07', category:'Food', difficulty:'medium', word:'waffle' },
  { id:'fm08', category:'Food', difficulty:'medium', word:'pretzel' },
  { id:'fm09', category:'Food', difficulty:'medium', word:'birthday cake' },
  { id:'fm10', category:'Food', difficulty:'medium', word:'lemonade' },
  { id:'fm11', category:'Food', difficulty:'medium', word:'hamburger' },
  { id:'fm12', category:'Food', difficulty:'medium', word:'fruit bowl' },
  // Food — hard
  { id:'fh01', category:'Food', difficulty:'hard', word:'spaghetti' },
  { id:'fh02', category:'Food', difficulty:'hard', word:'pineapple' },
  { id:'fh03', category:'Food', difficulty:'hard', word:'croissant' },
  { id:'fh04', category:'Food', difficulty:'hard', word:'corn on the cob' },
  { id:'fh05', category:'Food', difficulty:'hard', word:'bento box' },
  { id:'fh06', category:'Food', difficulty:'hard', word:'fortune cookie' },
  { id:'fh07', category:'Food', difficulty:'hard', word:'gingerbread house' },
  { id:'fh08', category:'Food', difficulty:'hard', word:'chocolate fountain' },
  { id:'fh09', category:'Food', difficulty:'hard', word:'stack of pancakes' },
  { id:'fh10', category:'Food', difficulty:'hard', word:'picnic basket' },
  { id:'fh11', category:'Food', difficulty:'hard', word:'pepper grinder' },
  { id:'fh12', category:'Food', difficulty:'hard', word:'takeout box' },

  // Places — easy
  { id:'pe01', category:'Places', difficulty:'easy', word:'beach' },
  { id:'pe02', category:'Places', difficulty:'easy', word:'school' },
  { id:'pe03', category:'Places', difficulty:'easy', word:'park' },
  { id:'pe04', category:'Places', difficulty:'easy', word:'house' },
  { id:'pe05', category:'Places', difficulty:'easy', word:'farm' },
  { id:'pe06', category:'Places', difficulty:'easy', word:'zoo' },
  { id:'pe07', category:'Places', difficulty:'easy', word:'library' },
  { id:'pe08', category:'Places', difficulty:'easy', word:'playground' },
  { id:'pe09', category:'Places', difficulty:'easy', word:'restaurant' },
  { id:'pe10', category:'Places', difficulty:'easy', word:'store' },
  { id:'pe11', category:'Places', difficulty:'easy', word:'campground' },
  { id:'pe12', category:'Places', difficulty:'easy', word:'garden' },
  // Places — medium
  { id:'pm01', category:'Places', difficulty:'medium', word:'airport' },
  { id:'pm02', category:'Places', difficulty:'medium', word:'museum' },
  { id:'pm03', category:'Places', difficulty:'medium', word:'train station' },
  { id:'pm04', category:'Places', difficulty:'medium', word:'aquarium' },
  { id:'pm05', category:'Places', difficulty:'medium', word:'stadium' },
  { id:'pm06', category:'Places', difficulty:'medium', word:'castle' },
  { id:'pm07', category:'Places', difficulty:'medium', word:'carnival' },
  { id:'pm08', category:'Places', difficulty:'medium', word:'movie theater' },
  { id:'pm09', category:'Places', difficulty:'medium', word:'coffee shop' },
  { id:'pm10', category:'Places', difficulty:'medium', word:'tree house' },
  { id:'pm11', category:'Places', difficulty:'medium', word:'swimming pool' },
  { id:'pm12', category:'Places', difficulty:'medium', word:'bus stop' },
  // Places — hard
  { id:'ph01', category:'Places', difficulty:'hard', word:'lighthouse' },
  { id:'ph02', category:'Places', difficulty:'hard', word:'observatory' },
  { id:'ph03', category:'Places', difficulty:'hard', word:'suspension bridge' },
  { id:'ph04', category:'Places', difficulty:'hard', word:'amusement park' },
  { id:'ph05', category:'Places', difficulty:'hard', word:'mountain cabin' },
  { id:'ph06', category:'Places', difficulty:'hard', word:'subway station' },
  { id:'ph07', category:'Places', difficulty:'hard', word:'botanical garden' },
  { id:'ph08', category:'Places', difficulty:'hard', word:'clock tower' },
  { id:'ph09', category:'Places', difficulty:'hard', word:'harbor' },
  { id:'ph10', category:'Places', difficulty:'hard', word:'ski resort' },
  { id:'ph11', category:'Places', difficulty:'hard', word:'camping site' },
  { id:'ph12', category:'Places', difficulty:'hard', word:'water park' },
];

export function quickDrawWords(category: QuickDrawCategory, difficulty: QuickDrawDifficulty) {
  return QUICK_DRAW_WORDS.filter((item) => item.category === category && item.difficulty === difficulty);
}
