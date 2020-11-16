import {
  CAPTURE_THUMBNAIL_WIDTH,
  CAPTURE_THUMBNAIL_HEIGHT,
} from "./constants.js";
import { secondToHms } from "./util.js";

export const captureTemplate = (number, time) => `
    <div class="capture" data-captured-time=${time}>
        <img class="capture__image" style="width:${CAPTURE_THUMBNAIL_WIDTH}px;height:${CAPTURE_THUMBNAIL_HEIGHT}px"/>
        <span class="capture__time">${secondToHms(time)}</span>
        <div class="capture__number">${number}</div>
        <div class="capture__icons">
            <i class="fas fa-arrow-up"></i>
            <i class="fas fa-arrow-down"></i>
            <i class="fas fa-times"></i>
        </div>
    </div>
`;
