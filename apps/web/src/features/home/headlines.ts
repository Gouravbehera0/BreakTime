export interface RawHeadlineItem {
  prefix: string;
  highlight: string;
  suffix: string;
  subtitle: string;
  // Fallbacks when user's display name is not available
  genericPrefix?: string;
  genericHighlight?: string;
  genericSuffix?: string;
}

export interface ResolvedHeadline {
  prefix: string;
  highlight: string;
  suffix: string;
  fullText: string;
  subtitle: string;
  graphemes: string[];
  highlightStart: number;
  highlightEnd: number;
}

/**
 * Splits text into user-perceived grapheme clusters.
 * Handles surrogate pairs, emojis (including compound/ZWJ), and accents properly.
 */
export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as unknown as { Segmenter: new (locales?: string | string[], options?: { granularity: 'grapheme' }) => { segment: (input: string) => Iterable<{ segment: string }> } }).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch {
      // Fallback if segmenter fails
    }
  }
  return Array.from(text);
}

/**
 * Resolves a raw headline item into graphemes and boundary indices,
 * applying the user's name or natural generic fallback.
 */
export function resolveHeadline(item: RawHeadlineItem, rawName?: string): ResolvedHeadline {
  const isNameAvailable = Boolean(
    rawName &&
    rawName.trim().length > 0 &&
    rawName.trim().toLowerCase() !== 'friend'
  );
  const cleanName = isNameAvailable ? rawName!.trim() : '';

  let prefix: string;
  let highlight: string;
  let suffix: string;

  if (isNameAvailable) {
    prefix = item.prefix.replace(/\{Name\}/g, cleanName);
    highlight = item.highlight.replace(/\{Name\}/g, cleanName);
    suffix = item.suffix.replace(/\{Name\}/g, cleanName);
  } else {
    prefix = (item.genericPrefix ?? item.prefix).replace(/\{Name\}/g, '');
    highlight = (item.genericHighlight ?? item.highlight).replace(/\{Name\}/g, '');
    suffix = (item.genericSuffix ?? item.suffix).replace(/\{Name\}/g, '');
  }

  const prefixGraphemes = segmentGraphemes(prefix);
  const highlightGraphemes = segmentGraphemes(highlight);
  const suffixGraphemes = segmentGraphemes(suffix);

  const graphemes = [...prefixGraphemes, ...highlightGraphemes, ...suffixGraphemes];
  const highlightStart = prefixGraphemes.length;
  const highlightEnd = prefixGraphemes.length + highlightGraphemes.length;

  return {
    prefix,
    highlight,
    suffix,
    fullText: prefix + highlight + suffix,
    subtitle: item.subtitle,
    graphemes,
    highlightStart,
    highlightEnd,
  };
}

/**
 * Collection of 60 unique headlines that speak directly to the current user.
 * Each item contains headline segments (prefix, highlight, suffix),
 * a contextual matching subtitle, and generic fallbacks.
 */
export const HEADLINE_COLLECTION: RawHeadlineItem[] = [
  // 1
  {
    prefix: "What's your tym today, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "What's your ",
    genericHighlight: "tym today",
    genericSuffix: "?",
    subtitle: "One tap turns an ordinary moment into a memory.",
  },
  // 2
  {
    prefix: "Bored? Let's ",
    highlight: "fix that",
    suffix: ".",
    subtitle: "No planning needed. See who's free right now.",
  },
  // 3
  {
    prefix: "What's the vibe today, ",
    highlight: "{Name}",
    suffix: "? 👀",
    genericPrefix: "What's the ",
    genericHighlight: "vibe today",
    genericSuffix: "? 👀",
    subtitle: "Check in with your circle and make something happen.",
  },
  // 4
  {
    prefix: "Your day needs a little ",
    highlight: "plot twist",
    suffix: ".",
    subtitle: "Step away from routine and catch a spontaneous break.",
  },
  // 5
  {
    prefix: "Same routine? Let's ",
    highlight: "change that",
    suffix: ".",
    subtitle: "Great memories start with an impromptu tap.",
  },
  // 6
  {
    prefix: "You didn't open this app for ",
    highlight: "nothing",
    suffix: ". 👀",
    subtitle: "Your people are just one invite away.",
  },
  // 7
  {
    prefix: "Your time. Your mood. ",
    highlight: "Your moment",
    suffix: ".",
    subtitle: "Pause the noise of the day for people that matter.",
  },
  // 8
  {
    prefix: "Come on, give today a ",
    highlight: "storyline",
    suffix: ".",
    subtitle: "Turn an ordinary hour into something unforgettable.",
  },
  // 9
  {
    prefix: "What's your kind of chaos today, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "What's your kind of ",
    genericHighlight: "chaos today",
    genericSuffix: "?",
    subtitle: "Chai run, night ride, or quick bite? You choose.",
  },
  // 10
  {
    prefix: "Ready for a little ",
    highlight: "something different",
    suffix: "?",
    subtitle: "Break the cycle. Reach out and catch up.",
  },
  // 11
  {
    prefix: "Today deserves a ",
    highlight: "plot twist",
    suffix: ".",
    subtitle: "The best times are always the ones you didn't plan.",
  },
  // 12
  {
    prefix: "Got a little free time? ",
    highlight: "Make it count",
    suffix: ".",
    subtitle: "Connect with someone who makes you laugh.",
  },
  // 13
  {
    prefix: "Your main character moment ",
    highlight: "starts now",
    suffix: ".",
    subtitle: "Life is happening right now, don't watch from the sidelines.",
  },
  // 14
  {
    prefix: "Be honest, you're bored, ",
    highlight: "aren't you",
    suffix: "? 💀",
    subtitle: "Put the endless scrolling down. Send an invite.",
  },
  // 15
  {
    prefix: "What would make today a ",
    highlight: "10/10",
    suffix: "?",
    subtitle: "Good company makes any regular day feel legendary.",
  },
  // 16
  {
    prefix: "Let the ",
    highlight: "random plans",
    suffix: " begin.",
    subtitle: "Zero stress, zero pressure. Just pure good vibes.",
  },
  // 17
  {
    prefix: "Give yourself a reason to ",
    highlight: "smile today",
    suffix: ".",
    subtitle: "A quick laugh with an old friend does wonders.",
  },
  // 18
  {
    prefix: "Life's happening ",
    highlight: "right now",
    suffix: ". ✨",
    subtitle: "Pause the world for a bit and live the moment.",
  },
  // 19
  {
    prefix: "Your next adventure is ",
    highlight: "waiting",
    suffix: ".",
    subtitle: "Take a break, grab a drink, and hit the road.",
  },
  // 20
  {
    prefix: "Another day of scrolling? ",
    highlight: "Not today",
    suffix: ".",
    subtitle: "Real connections happen off the feed.",
  },
  // 21
  {
    prefix: "Make today feel a little ",
    highlight: "different",
    suffix: ".",
    subtitle: "Small breaks lead to the brightest memories.",
  },
  // 22
  {
    prefix: "Step away from the screen, ",
    highlight: "{Name}",
    suffix: ".",
    genericPrefix: "Step away from the ",
    genericHighlight: "screen",
    genericSuffix: " for a bit.",
    subtitle: "Your eyes need a rest and your soul needs a break.",
  },
  // 23
  {
    prefix: "The world can wait. What do ",
    highlight: "you need",
    suffix: " right now?",
    subtitle: "Take back your time and make space for fun.",
  },
  // 24
  {
    prefix: "Pause the noise. ",
    highlight: "Live the moment",
    suffix: ".",
    subtitle: "BreakTym is made for spontaneous living.",
  },
  // 25
  {
    prefix: "What are you craving today, ",
    highlight: "{Name}",
    suffix: "? ☕",
    genericPrefix: "What are you ",
    genericHighlight: "craving today",
    genericSuffix: "? ☕",
    subtitle: "A quick tea, coffee, or bite with your favourite person.",
  },
  // 26
  {
    prefix: "Time to make an ",
    highlight: "unplanned memory",
    suffix: ".",
    subtitle: "The unplanned adventures are the ones you talk about for years.",
  },
  // 27
  {
    prefix: "Who says today has to be ",
    highlight: "ordinary",
    suffix: "?",
    subtitle: "Shake things up with a 15-minute hangout.",
  },
  // 28
  {
    prefix: "Drop the busywork for ",
    highlight: "a second",
    suffix: ".",
    subtitle: "You've worked enough. You deserve a quick pause.",
  },
  // 29
  {
    prefix: "A quick break ",
    highlight: "changes everything",
    suffix: ".",
    subtitle: "Recharge your energy with someone who gets you.",
  },
  // 30
  {
    prefix: "Got 20 minutes? ",
    highlight: "Turn it into fun",
    suffix: ".",
    subtitle: "It doesn't take hours to make a memorable moment.",
  },
  // 31
  {
    prefix: "What is today missing, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "What is today ",
    genericHighlight: "missing",
    genericSuffix: "?",
    subtitle: "Probably good chai and an even better conversation.",
  },
  // 32
  {
    prefix: "Put the routine on ",
    highlight: "pause",
    suffix: ".",
    subtitle: "Give yourself permission to do something spontaneous.",
  },
  // 33
  {
    prefix: "Spontaneous plans ",
    highlight: "hit different",
    suffix: ".",
    subtitle: "No reservations, no schedules. Just real vibes.",
  },
  // 34
  {
    prefix: "Your schedule can spare a ",
    highlight: "little break",
    suffix: ".",
    subtitle: "Don't let the day pass without doing something you love.",
  },
  // 35
  {
    prefix: "How about a change of scenery, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "How about a ",
    genericHighlight: "change of scenery",
    genericSuffix: "?",
    subtitle: "Step outside, feel the fresh air, and unwind.",
  },
  // 36
  {
    prefix: "Let's find your next ",
    highlight: "favorite moment",
    suffix: ".",
    subtitle: "One spontaneous invite is all it takes.",
  },
  // 37
  {
    prefix: "Don't let today slip away ",
    highlight: "unnoticed",
    suffix: ".",
    subtitle: "Mark today with a memory worth smiling about.",
  },
  // 38
  {
    prefix: "Take a breather, ",
    highlight: "{Name}",
    suffix: ". You earned it.",
    genericPrefix: "Take a breather. You ",
    genericHighlight: "earned it",
    genericSuffix: ".",
    subtitle: "Rest isn't a reward, it's a necessity.",
  },
  // 39
  {
    prefix: "What's calling your name ",
    highlight: "right now",
    suffix: "?",
    subtitle: "Chai, late night snack, or a quiet walk with a buddy?",
  },
  // 40
  {
    prefix: "Ready to pause the world ",
    highlight: "for a bit",
    suffix: "?",
    subtitle: "The deadlines will wait. Your life is happening now.",
  },
  // 41
  {
    prefix: "Do something your future self will ",
    highlight: "smile about",
    suffix: ".",
    subtitle: "Nobody remembers the emails they sent, but they remember the breaks.",
  },
  // 42
  {
    prefix: "Today is too good to spend ",
    highlight: "doing nothing",
    suffix: ".",
    subtitle: "Even a 10-minute catchup makes the day brighter.",
  },
  // 43
  {
    prefix: "A little spontaneous energy never hurt, ",
    highlight: "{Name}",
    suffix: ".",
    genericPrefix: "A little ",
    genericHighlight: "spontaneous energy",
    genericSuffix: " never hurt.",
    subtitle: "Break the mundane and do something wild.",
  },
  // 44
  {
    prefix: "Close your tabs. ",
    highlight: "Open up free time",
    suffix: ".",
    subtitle: "Turn work hours into a golden memory.",
  },
  // 45
  {
    prefix: "What kind of memory are you ",
    highlight: "making today",
    suffix: "?",
    subtitle: "Write a fresh page in your story today.",
  },
  // 46
  {
    prefix: "Your afternoon deserves an ",
    highlight: "upgrade",
    suffix: ".",
    subtitle: "Turn a dull afternoon into the highlight of your week.",
  },
  // 47
  {
    prefix: "Hit pause, ",
    highlight: "{Name}",
    suffix: ". Take a breath.",
    genericPrefix: "Hit pause. ",
    genericHighlight: "Take a breath",
    genericSuffix: ".",
    subtitle: "Slow down and give yourself room to recharge.",
  },
  // 48
  {
    prefix: "What would make right now ",
    highlight: "unforgettable",
    suffix: "?",
    subtitle: "An impromptu trip, an ice cream run, or endless laughs.",
  },
  // 49
  {
    prefix: "Life happens between the ",
    highlight: "busy hours",
    suffix: ".",
    subtitle: "Don't let the calendar dictate your best memories.",
  },
  // 50
  {
    prefix: "Why wait for ",
    highlight: "the weekend",
    suffix: "?",
    subtitle: "Any weekday can be extraordinary if you choose to make it so.",
  },
  // 51
  {
    prefix: "Ready to make some noise today, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "Ready to make ",
    genericHighlight: "some noise",
    genericSuffix: " today?",
    subtitle: "Call up your inner circle and start something fun.",
  },
  // 52
  {
    prefix: "Break the routine before it ",
    highlight: "breaks you",
    suffix: ".",
    subtitle: "A 10-minute break changes your whole mindset.",
  },
  // 53
  {
    prefix: "Take five minutes just ",
    highlight: "for you",
    suffix: ", {Name}.",
    genericPrefix: "Take five minutes just ",
    genericHighlight: "for you",
    genericSuffix: ".",
    subtitle: "Your peace of mind comes before anything else.",
  },
  // 54
  {
    prefix: "The best plans are always the ",
    highlight: "unplanned ones",
    suffix: ".",
    subtitle: "Send a quick ping and let the day unfold.",
  },
  // 55
  {
    prefix: "Go on, give yourself permission to ",
    highlight: "chill",
    suffix: ".",
    subtitle: "Unwind, loosen up, and take it easy.",
  },
  // 56
  {
    prefix: "What's your next spontaneous move, ",
    highlight: "{Name}",
    suffix: "?",
    genericPrefix: "What's your next ",
    genericHighlight: "spontaneous move",
    genericSuffix: "?",
    subtitle: "Pick an activity and see who's ready to roll.",
  },
  // 57
  {
    prefix: "Chai and good vibes? ",
    highlight: "Say less",
    suffix: ". ☕",
    subtitle: "The simplest plans always bring the biggest comfort.",
  },
  // 58
  {
    prefix: "Stop overthinking today, ",
    highlight: "{Name}",
    suffix: ". Just live it.",
    genericPrefix: "Stop overthinking today. ",
    genericHighlight: "Just live it",
    genericSuffix: ".",
    subtitle: "Overthinking burns energy. Spontaneous living creates it.",
  },
  // 59
  {
    prefix: "Small breaks lead to ",
    highlight: "big smiles",
    suffix: ".",
    subtitle: "Make room in your schedule for laughter.",
  },
  // 60
  {
    prefix: "Time to turn free time into ",
    highlight: "your time",
    suffix: ".",
    subtitle: "Your moment is right in front of you.",
  },
];
