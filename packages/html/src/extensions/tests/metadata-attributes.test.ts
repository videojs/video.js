import { describe, expect, it } from 'vite-plus/test';

import { mergeExtensionMetadata, metadataKeyFromAttribute, readMetadataAttributes } from '../metadata-attributes';

describe('metadataKeyFromAttribute', () => {
  it('maps metadata-* names to snake_case keys', () => {
    expect(metadataKeyFromAttribute('metadata-video-title')).toBe('video_title');
    expect(metadataKeyFromAttribute('metadata-viewer-user-id')).toBe('viewer_user_id');
    expect(metadataKeyFromAttribute('metadata-custom-1')).toBe('custom_1');
  });

  it('ignores names without the metadata- prefix', () => {
    expect(metadataKeyFromAttribute('env-key')).toBeNull();
    expect(metadataKeyFromAttribute('metadata')).toBeNull();
    expect(metadataKeyFromAttribute('data-metadata-video-title')).toBeNull();
  });
});

describe('readMetadataAttributes', () => {
  it('reads only metadata-* attributes', () => {
    const el = document.createElement('mux-data');

    el.setAttribute('metadata-video-title', 'Title');
    el.setAttribute('metadata-viewer-user-id', 'user-1');
    el.setAttribute('env-key', 'secret');
    el.setAttribute('debug', '');

    expect(readMetadataAttributes(el)).toEqual({
      video_title: 'Title',
      viewer_user_id: 'user-1',
    });
  });
});

describe('mergeExtensionMetadata', () => {
  it('merges attributes and property metadata with property precedence', () => {
    expect(
      mergeExtensionMetadata({ video_title: 'Attr', custom_1: 'a' }, { video_title: 'Prop', video_id: 'id' })
    ).toEqual({
      video_title: 'Prop',
      custom_1: 'a',
      video_id: 'id',
    });
  });

  it('returns undefined when both sides are empty', () => {
    expect(mergeExtensionMetadata({}, undefined)).toBeUndefined();
  });

  it('reuses the property object when there are no attributes', () => {
    const property = { video_title: 'Prop' };

    expect(mergeExtensionMetadata({}, property)).toBe(property);
  });
});
