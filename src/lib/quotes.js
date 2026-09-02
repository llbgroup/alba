export const QUOTES = [
  { text: 'Fokus heißt vor allem, Nein zu sagen.', by: 'Steve Jobs' },
  { text: 'Bleib hungrig. Bleib unvernünftig.', by: 'Steve Jobs' },
  { text: 'Einfach ist schwerer als komplex.', by: 'Steve Jobs' },
  { text: 'Echte Künstler liefern.', by: 'Steve Jobs' },
  { text: 'Die, die verrückt genug sind zu glauben, sie könnten die Welt verändern, tun es.', by: 'Steve Jobs' },
  { text: 'Dein Werk füllt einen großen Teil deines Lebens. Die einzige echte Zufriedenheit: etwas, das du für groß hältst.', by: 'Steve Jobs' },
  { text: 'Wenn etwas wichtig genug ist, tust du es auch gegen die Odds.', by: 'Elon Musk' },
  { text: 'Beharrlichkeit zählt. Gib nicht auf, solange du nicht musst.', by: 'Elon Musk' },
  { text: 'Gewöhnliche Menschen können beschließen, außergewöhnlich zu sein.', by: 'Elon Musk' },
  { text: 'Zuerst zeigen, dass es möglich ist. Die Wahrscheinlichkeit folgt.', by: 'Elon Musk' },
  { text: 'Du steigst nicht auf das Niveau deiner Ziele. Du fällst auf das Niveau deiner Systeme.', by: 'James Clear' },
  { text: 'Jede Handlung ist eine Stimme für den Menschen, der du werden willst.', by: 'James Clear' },
  { text: 'Das Hindernis zur Handlung treibt die Handlung voran. Was im Weg steht, wird zum Weg.', by: 'Marc Aurel' },
  { text: 'Verschwende keine Zeit damit, über den guten Menschen nachzudenken. Sei einer.', by: 'Marc Aurel' },
  { text: 'Wir leiden öfter in der Vorstellung als in der Wirklichkeit.', by: 'Seneca' },
  { text: 'Es ist nicht wenig Zeit, die wir haben, sondern viel, die wir nicht nutzen.', by: 'Seneca' },
  { text: 'Erkläre deine Philosophie nicht. Verkörpere sie.', by: 'Epiktet' },
  { text: 'Wie wir unsere Tage verbringen, so verbringen wir unser Leben.', by: 'Annie Dillard' },
  { text: 'Fang an, bevor du bereit bist.', by: 'Steven Pressfield' },
  { text: 'Vergiss Inspiration. Gewohnheit ist verlässlicher.', by: 'Octavia Butler' },
  { text: 'Konzentriere dich auf das, was sich nicht ändert.', by: 'Jeff Bezos' },
  { text: 'Der erste Grundsatz: täusche dich nicht selbst.', by: 'Richard Feynman' },
  { text: 'Große Dinge fangen täuschend klein an.', by: 'Paul Graham' },
  { text: 'Spiele lange Spiele mit langen Menschen.', by: 'Naval Ravikant' },
  { text: 'Wer ein Warum zum Leben hat, erträgt fast jedes Wie.', by: 'Friedrich Nietzsche' },
  { text: 'Es ist nicht genug zu wissen, man muss auch anwenden.', by: 'Johann Wolfgang von Goethe' },
  { text: 'Lebe jetzt die Fragen.', by: 'Rainer Maria Rilke' },
  { text: 'Der Berg bewegt sich, indem du kleine Steine trägst.', by: 'Konfuzius' },
  { text: 'Wenn es kein Hölle-ja ist, ist es ein Nein.', by: 'Derek Sivers' },
  { text: 'Gehe selbstbewusst in die Richtung deiner Träume.', by: 'Henry David Thoreau' },
  { text: 'Du verfehlst hundert Prozent der Schüsse, die du nicht abgibst.', by: 'Wayne Gretzky' },
  { text: 'Qualität ist kein Akt, sie ist eine Gewohnheit.', by: 'Aristoteles' },
  { text: 'Was du tun kannst, oder träumst tun zu können: fang an. Kühnheit trägt Genius in sich.', by: 'William Hutchinson Murray' },
  { text: 'Die Zukunft gehört denen, die an der Schönheit ihrer Träume festhalten.', by: 'Eleanor Roosevelt' },
  { text: 'Tu das Schwere, solange es leicht ist.', by: 'Laozi' },
  { text: 'Nicht weil es schwer ist, wagen wir es nicht. Weil wir es nicht wagen, ist es schwer.', by: 'Seneca' },
]

function hashDate(iso) {
  let h = 2166136261
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function quoteFor(dateISO, shift = 0) {
  const i = (hashDate(dateISO) + (shift || 0)) % QUOTES.length
  return QUOTES[i]
}
