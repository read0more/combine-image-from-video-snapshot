// import dragula from "dragula";
import { captureTemplate } from "./utils/templates.js";
import {
  CAPTURE_THUMBNAIL_WIDTH,
  CAPTURE_THUMBNAIL_HEIGHT,
  CAPTURE_LIMIT,
} from "./utils/constants.js";

let combineCaptureCount = CAPTURE_LIMIT;
const videoPlayer = document.querySelector("#video-player");
const captureBtn = document.querySelector(".capture-btn");
const captureList = document.querySelector("#capture-list");
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
canvas.width = CAPTURE_THUMBNAIL_WIDTH;
canvas.height = CAPTURE_THUMBNAIL_HEIGHT;

const getCaptureCount = () => captureList.querySelectorAll(".capture").length;
const removeCaptureElements = (...elements) =>
  elements.forEach((element) => element.remove());

async function processCapture(captureFunction) {
  const loadingContainer = document.querySelector(".loading-container");
  loadingContainer.classList.add("active");
  const priviousPaused = videoPlayer.paused;
  videoPlayer.pause();

  await captureFunction();

  priviousPaused || videoPlayer.play();
  loadingContainer.classList.remove("active");
}

function onChangeCombineCaptureCount() {
  const captureCount = document.querySelector(".capture__count");
  captureCount.addEventListener("change", ({ target }) => {
    const newValue = Number(target.value);
    if (newValue < target.min) {
      target.value = target.min;
    } else if (target.max < newValue) {
      target.value = target.max;
    }

    if (combineCaptureCount !== newValue) {
      combineCaptureCount = newValue;
      arrangeAside(getCaptureCount());
    }
  });
}

function onLoadVideo() {
  const loadVideo = document.querySelector("#load-video");
  loadVideo.addEventListener("change", () => {
    const loadedVideo = loadVideo.files[0];
    const filenameInput = document.querySelector(".filename");
    const videoId = document.querySelector("#video-id");
    let filename = loadedVideo.name;
    filename = filename.substring(0, filename.lastIndexOf(".")) || filename;

    filenameInput.value = filename;
    videoId.setAttribute("src", URL.createObjectURL(loadedVideo));
    captureList
      .querySelectorAll(".capture")
      .forEach((capture) => capture.remove());
    videoPlayer.load();
  });

  videoPlayer.addEventListener("loadeddata", () => {
    captureBtn.classList.remove("disable");
  });
}

function orderActiveCapture(captureCount) {
  let currentNumber =
    captureCount < combineCaptureCount ? captureCount : combineCaptureCount;

  for (let capture of captureList.querySelectorAll(".capture")) {
    const captureNumber = capture.querySelector(".capture__number");

    if (currentNumber <= 0) {
      capture.classList.remove("active");
      continue;
    }

    capture.classList.add("active");
    captureNumber.textContent = `${currentNumber--}`;
  }
}

function arrangeAside(captureCount) {
  orderActiveCapture(captureCount);
  if (0 < captureCount) {
    document
      .querySelector(".download-form__submit")
      .classList.remove("disable");
  }
}

function onClickCaptureButton() {
  captureBtn.addEventListener("click", (event) => {
    if (event.target.classList.contains("disable")) {
      return;
    }

    processCapture(() => {
      const captureCount = getCaptureCount() + 1;
      const captureNumber =
        captureCount < combineCaptureCount ? captureCount : combineCaptureCount;
      const newCapture = captureTemplate(
        captureNumber,
        videoPlayer.currentTime
      );

      captureList.innerHTML = newCapture + captureList.innerHTML;
      const captureImage = captureList.querySelector(".capture__image");
      arrangeAside(captureCount);

      context.drawImage(
        videoPlayer,
        0,
        0,
        captureImage.width,
        captureImage.height
      );

      // innerHTML(이 함수 및 드래그&드랍 함수에서 사용)로 갱신하면 이전에 canvas에서 그린 내용이 사라지므로 dataURL이용
      captureImage.src = canvas.toDataURL();
    });
  });
}

function swapCaptureHTML(captureA, captureB) {
  if (captureA && captureB) {
    [captureA.innerHTML, captureB.innerHTML] = [
      captureB.innerHTML,
      captureA.innerHTML,
    ];

    [captureA.dataset.capturedTime, captureB.dataset.capturedTime] = [
      captureB.dataset.capturedTime,
      captureA.dataset.capturedTime,
    ];
  }
}

function onClickCaptureIcon() {
  captureList.addEventListener("click", ({ target }) => {
    const capture = target.closest(".capture");
    let captureCount = getCaptureCount();

    if (target.nodeName !== "I") {
      return;
    }

    if (target.classList.contains("fa-arrow-up")) {
      swapCaptureHTML(capture, capture.previousElementSibling);
    } else if (target.classList.contains("fa-arrow-down")) {
      swapCaptureHTML(capture, capture.nextElementSibling);
    } else if (target.classList.contains("fa-times")) {
      removeCaptureElements(capture);
      captureCount -= 1;
    }

    arrangeAside(captureCount);
  });
}

function downloadResult(dataURL) {
  var a = document.createElement("a");
  a.href = dataURL;
  a.setAttribute("download", "test.png");
  a.click();
}

async function combineImages(width, height) {
  width = Number(width);
  height = Number(height);

  const activeCaptureList = captureList.querySelectorAll(".capture.active");
  const resultCanvas = document.createElement("canvas");
  const resultContext = resultCanvas.getContext("2d");
  let currentHeight = 0;
  resultCanvas.width = width;
  resultCanvas.height = height * activeCaptureList.length;

  for await (let activeCapture of activeCaptureList) {
    await new Promise((resolve) => {
      videoPlayer.addEventListener(
        "seeked",
        () => {
          resultContext.drawImage(videoPlayer, 0, currentHeight, width, height);
          currentHeight += height;
          resolve();
        },
        { once: true }
      );
      videoPlayer.currentTime = activeCapture.dataset.capturedTime;
    });
  }

  return resultCanvas.toDataURL();
}

function submitForm() {
  const downloadForm = document.querySelector(".download-form");

  downloadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (getCaptureCount() <= 0) {
      return;
    }

    processCapture(async () => {
      const previousTime = videoPlayer.currentTime;
      const [width, height] = event.target
        .querySelector(".resolution")
        .value.split("x");

      const dataURL = await combineImages(width, height);
      downloadResult(dataURL);
      videoPlayer.currentTime = previousTime;

      if (event.target.querySelector(".after-delete input").checked) {
        removeCaptureElements(
          ...captureList.querySelectorAll(".capture.active")
        );
        arrangeAside(getCaptureCount());
      }
    });
  });
}

function activeCaptureDraggable() {
  const drake = window.dragula([document.querySelector("#capture-list")], {
    mirrorContainer: document.querySelector("#capture-list"),
  });
  drake.on("dragend", () => arrangeAside(getCaptureCount()));

  window.autoScroll([window, document.querySelector("#capture-list")], {
    maxSpeed: 20,
    margin: 20,
    autoScroll: function () {
      return this.down && drake.dragging;
    },
  });
}

function init() {
  onChangeCombineCaptureCount();
  onLoadVideo();
  onClickCaptureButton();
  onClickCaptureIcon();
  submitForm();
  activeCaptureDraggable();
}

init();
