import type { Translations } from '../params';

export default {
  buttons: {
    play: 'Αναπαραγωγή',
    pause: 'Παύση',
    replay: 'Επανάληψη',
    mute: 'Σίγαση',
    unmute: 'Κατάργηση σίγασης',
  },
  seek: {
    forward: 'Μετάβαση μπροστά κατά {seconds} δευτερόλεπτα',
    backward: 'Μετάβαση πίσω κατά {seconds} δευτερόλεπτα',
  },
  fullscreen: {
    enter: 'Πλήρης οθόνη',
    exit: 'Έξοδος από πλήρη οθόνη',
  },
  captions: {
    enable: 'Ενεργοποίηση υποτίτλων',
    disable: 'Απενεργοποίηση υποτίτλων',
  },
  pip: {
    enter: 'Εικόνα μέσα σε εικόνα',
    exit: 'Έξοδος από εικόνα μέσα σε εικόνα',
  },
  live: {
    playing: 'Αναπαραγωγή ζωντανά',
    seekToEdge: 'Μετάβαση στη ζωντανή μετάδοση',
    badge: 'Ζωντανά',
  },
  cast: {
    start: 'Έναρξη μετάδοσης',
    stop: 'Διακοπή μετάδοσης',
    connecting: 'Σύνδεση',
  },
  airplay: {
    start: 'Έναρξη AirPlay',
    stop: 'Διακοπή AirPlay',
  },
  slider: {
    seek: 'Μετακίνηση',
  },
  time: {
    current: 'Τρέχων χρόνος',
    duration: 'Διάρκεια',
    remaining: 'Υπολειπόμενος χρόνος',
    elapsedSuffix: 'Πέρασαν {duration}',
    durationSuffix: 'Διάρκεια {duration}',
    remainingSuffix: 'Απομένουν {duration}',
    showElapsed: 'Εμφάνιση χρόνου που πέρασε, {duration}.',
    showDuration: 'Εμφάνιση διάρκειας, {duration}.',
    showRemaining: 'Εμφάνιση υπολειπόμενου χρόνου, {duration}.',
    toggleElapsed: 'Εναλλαγή μεταξύ χρόνου που πέρασε και χρόνου που απομένει.',
    toggleDuration: 'Εναλλαγή μεταξύ διάρκειας και χρόνου που απομένει.',
    position: '{current} από {duration}',
    unknown: 'Το μέσο δεν φορτώθηκε, άγνωστη διάρκεια.',
  },
  playback: {
    rate: 'Ρυθμός αναπαραγωγής, {rate}',
  },
  volume: {
    mutedValue: '{percent}, σε σίγαση',
    muted: 'Σε σίγαση',
    label: 'Ένταση',
    value: 'Ένταση {value}',
  },
  status: {
    captionsOn: 'Υπότιτλοι ενεργοί',
    captionsOff: 'Υπότιτλοι ανενεργοί',
    paused: 'Σε παύση',
    playing: 'Σε αναπαραγωγή',
    fullscreen: 'Πλήρης οθόνη',
    pip: 'Εικόνα μέσα σε εικόνα',
    exitPip: 'Έξοδος από εικόνα μέσα σε εικόνα',
    seekedTo: 'Μετάβαση σε {time}',
  },
  container: {
    label: 'Πρόγραμμα αναπαραγωγής πολυμέσων',
  },
  errors: {
    aborted: 'Διακόψατε την αναπαραγωγή του μέσου πριν ολοκληρωθεί.',
    network: 'Δεν ήταν δυνατή η φόρτωση αυτού του μέσου λόγω προβλήματος δικτύου ή διακομιστή.',
    decode:
      'Δεν ήταν δυνατή η αναπαραγωγή αυτού του μέσου. Μπορεί να είναι κατεστραμμένο ή το πρόγραμμα περιήγησής σας να μην υποστηρίζει τη μορφή του.',
    source:
      'Δεν ήταν δυνατή η φόρτωση αυτού του μέσου. Μπορεί να μην είναι διαθέσιμο ή το πρόγραμμα περιήγησής σας να μην υποστηρίζει τη μορφή του.',
    encrypted: 'Δεν ήταν δυνατή η αναπαραγωγή αυτού του μέσου, επειδή δεν μπόρεσε να αποκρυπτογραφηθεί.',
    unplayable: 'Αυτό το μέσο δεν υποστηρίζεται από το πρόγραμμα αναπαραγωγής.',
    title: 'Κάτι πήγε στραβά.',
    unexpected: 'Παρουσιάστηκε μη αναμενόμενο σφάλμα.',
  },
  common: {
    empty: '',
    ok: 'Κλείσιμο',
  },
  menu: {
    settings: 'Ρυθμίσεις',
    quality: 'Ποιότητα',
    audio: 'Ήχος',
    default: 'Προεπιλογή',
    speed: 'Ταχύτητα',
    captions: 'Λεζάντες',
    playbackRate: 'Ρυθμός αναπαραγωγής',
    back: 'Πίσω',
    off: 'Απενεργοποίηση',
    auto: 'Αυτόματα',
    autoWithLabel: 'Αυτόματα ({label})',
    subtitles: 'Υπότιτλοι',
  },
} as const satisfies Translations;
