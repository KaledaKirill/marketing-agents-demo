import type { Survey } from '@/types/research';

export const responseComments: Record<Survey['topic'], string[]> = {
  ev: [
    'The car handles my commute well, but winter range drops more than I expected.',
    'Home charging is straightforward. On longer trips I still check two apps to find a working charger.',
    'I would like charging prices to be shown clearly before I plug in.',
    'No major complaints so far. I rarely need to charge away from home.',
    'More reliable chargers near my apartment would make a bigger difference than extra in-car features.',
    'The route planner sometimes sends me to stations with a queue. Live availability would help.',
  ],
  smartphone: [
    'I would consider switching if the battery lasted through a full day after a couple of years.',
    'My current phone still works, so I would need a noticeable camera improvement to replace it.',
    'I compare the total price with the trade-in offer. A small monthly payment can hide a high overall cost.',
    'Longer software support would matter more to me than a slightly faster processor.',
    'Moving photos and messages to another brand is a concern. An easier transfer would help.',
    'I usually buy the previous model once the price drops. I do not need the newest release.',
  ],
  brand: [
    'I have seen the logo on Instagram, but I could not tell you much about the products.',
    'Practical outdoor clothing. I would compare the prices with other brands before buying.',
    'The jackets in the shop window are the first thing I think of.',
    'A friend mentioned their waterproof jacket. I have not tried the brand myself.',
    'I recognize the name, but I am not sure what makes it different from other outdoor brands.',
    'I had not heard of Northline before this survey.',
  ],
  general: [
    'The core tasks work well, but finding an older item takes too many steps.',
    'I would like clearer pricing before I commit to a plan.',
    'It meets my needs most days. I mainly notice issues when something fails and I need support.',
    'There are features I have never used. Better explanations at the point of use would help.',
    'I would prefer fewer steps for the things I do every week.',
    'Reliability matters more to me than adding another feature.',
  ],
};
