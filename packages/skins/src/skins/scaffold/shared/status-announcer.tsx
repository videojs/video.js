import * as $ from '@videojs/core/vjsc';

import statusAnnouncerStyles from './status-announcer.styles';

export function StatusAnnouncer() {
  return <$.StatusAnnouncer className={statusAnnouncerStyles.root} />;
}
