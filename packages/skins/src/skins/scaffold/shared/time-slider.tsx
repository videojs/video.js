import * as $ from '@videojs/core/vjsc';
import { Box, type PropsOf, Template } from 'vjsc/components';

import controlsStyles from './controls.styles';
import thumbnailStyles from './thumbnail.styles';
import timeSliderStyles from './time-slider.styles';

export function TimeSlider({ audio = false, renderThumbnail }: ThumbnailSlot & { audio?: boolean } = {}) {
  return (
    <Box className={controlsStyles.sliderRow}>
      <$.TimeSlider.Root className={timeSliderStyles.root} thumbAlignment="edge">
        <$.TimeSlider.Chapters className={timeSliderStyles.chapters}>
          <Template name="chapter" className={timeSliderStyles.chapter}>
            <$.TimeSlider.Track className={[timeSliderStyles.track, audio && timeSliderStyles.audioTrack]}>
              <$.TimeSlider.Buffer className={[timeSliderStyles.buffer, audio && timeSliderStyles.audioBuffer]} />
              <$.TimeSlider.Fill className={timeSliderStyles.fill} />
            </$.TimeSlider.Track>
          </Template>
        </$.TimeSlider.Chapters>
        <$.TimeSlider.Thumb className={timeSliderStyles.thumb} />

        <$.TimeSlider.Preview className={timeSliderStyles.preview}>
          <$.Slider.Thumbnail.Root className={thumbnailStyles.root}>
            <$.Slider.Thumbnail.Image className={thumbnailStyles.image}>{renderThumbnail}</$.Slider.Thumbnail.Image>
          </$.Slider.Thumbnail.Root>
          <Box className={[timeSliderStyles.previewMeta, audio && timeSliderStyles.audioPreviewMeta]}>
            <Box className={timeSliderStyles.previewLabel}>
              <$.TimeSlider.Value className={timeSliderStyles.value} type="pointer" />
              <$.TimeSlider.ChapterTitle className={timeSliderStyles.chapterTitle} />
            </Box>
          </Box>
        </$.TimeSlider.Preview>
      </$.TimeSlider.Root>
    </Box>
  );
}

export interface ThumbnailSlot {
  /** Draws the storyboard frame in the slider preview in place of the one the skin renders. */
  renderThumbnail?: PropsOf<typeof $.Slider.Thumbnail.Image>['children'];
}
