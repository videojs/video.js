export namespace NORMAL {
    const names: string[];
}
export namespace REMOTE {
    const names_1: string[];
    export { names_1 as names };
}
export const ALL: {
    audio: {
        ListClass: typeof AudioTrackList;
        TrackClass: typeof AudioTrack;
        capitalName: string;
    };
    video: {
        ListClass: typeof VideoTrackList;
        TrackClass: typeof VideoTrack;
        capitalName: string;
    };
    text: {
        ListClass: typeof TextTrackList;
        TrackClass: typeof TextTrack;
        capitalName: string;
    };
} & {
    remoteText: {
        ListClass: typeof TextTrackList;
        TrackClass: typeof TextTrack;
        capitalName: string;
        getterName: string;
        privateName: string;
    };
    remoteTextEl: {
        ListClass: typeof HtmlTrackElementList;
        TrackClass: typeof HTMLTrackElement;
        capitalName: string;
        getterName: string;
        privateName: string;
    };
};
import AudioTrackList from "./audio-track-list";
import AudioTrack from "./audio-track";
import VideoTrackList from "./video-track-list";
import VideoTrack from "./video-track";
import TextTrackList from "./text-track-list";
import TextTrack from "./text-track";
import HtmlTrackElementList from "./html-track-element-list";
import HTMLTrackElement from "./html-track-element";
//# sourceMappingURL=track-types.d.ts.map