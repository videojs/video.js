# Clear Key e2e fixture

A ~2s cenc-encrypted (AES-CTR) video-only CMAF asset for `engine-clearkey.test.ts`, which drives the
real EME pipeline — negotiate → attach → license → decode — on the bundled Chromium, whose only key
system is `org.w3.clearkey`.

Key pair (public by design; the test's fake license server serves it back as a JWK):

- KID `00112233445566778899aabbccddeeff`
- key `0123456789abcdef0123456789abcdef`

`video.m3u8`'s `EXT-X-KEY` carries a v1 "common" PSSH (system id
`1077efec-c0b2-4d02-ace3-3c1e52e2fb4b`, that one KID) as a `data:` URI under the same URN as its
KEYFORMAT — the manifest-driven session shape `clearKeySystem` expects. `METHOD=SAMPLE-AES-CTR`
declares the cenc scheme.

## Regenerating

Requires ffmpeg and GPAC's MP4Box. ffmpeg alone cannot produce this asset: its mov muxer writes the
sample-encryption boxes (`senc`/`saiz`/`saio`) into `moov/stbl` and leaves fragments bare, which
Chromium rejects with "Sample encryption info is not available" — so encryption and fragmentation go
through MP4Box.

```bash
# 1. A tiny plain source: 2s, 192x108, 1s GOPs (=> two 1s fragments).
ffmpeg -y -f lavfi -i "testsrc2=duration=2:size=192x108:rate=15" \
  -c:v libx264 -profile:v baseline -pix_fmt yuv420p -g 15 -keyint_min 15 -sc_threshold 0 -crf 35 \
  -an plain.mp4

# 2. Encrypt (GPAC drm.xml), then fragment; senc/saiz/saio land in each traf.
cat > drm.xml <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<GPACDRM type="CENC AES-CTR">
  <CrypTrack trackID="1" IsEncrypted="1" IV_size="8" first_IV="0x1122334455667788" saiSavedBox="senc">
    <key KID="0x00112233445566778899aabbccddeeff" value="0x0123456789abcdef0123456789abcdef"/>
  </CrypTrack>
</GPACDRM>
XML
MP4Box -crypt drm.xml plain.mp4 -out enc.mp4
MP4Box -dash 1000 -frag 1000 -rap -segment-name 'seg-' enc.mp4

# 3. Rename into place (the .mpd is discarded; the playlists here are hand-authored).
#    seg-init.mp4 -> init.mp4, seg-1.m4s -> seg-0.m4s, seg-2.m4s -> seg-1.m4s
```

If the codec string changes (a different encoder/profile), update `CODECS` in `multivariant.m3u8`
from the new init's avcC: bytes 1–3 after the `avcC` fourcc are profile/compat/level, rendered as
`avc1.PPCCLL` hex. The PSSH in `video.m3u8` only names the KID, so it survives regeneration as long
as the KID stays the same.
