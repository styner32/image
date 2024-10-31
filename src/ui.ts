import { IconChevronUp, IconCross, IconPicture } from "@codexteam/icons";
import { make } from "./utils/dom";
import type { API } from "@editorjs/editorjs";
import type { ImageToolData, ImageConfig } from "./types/types";

/**
 * Enumeration representing the different states of the UI.
 */
enum UiState {
  /**
   * The UI is in an empty state, with no image loaded or being uploaded.
   */
  Empty = "empty",

  /**
   * The UI is in an uploading state, indicating an image is currently being uploaded.
   */
  Uploading = "uploading",

  /**
   * The UI is in a filled state, with an image successfully loaded.
   */
  Filled = "filled",
}

/**
 * Nodes interface representing various elements in the UI.
 */
interface Nodes {
  /**
   * Wrapper element in the UI.
   */
  wrapper: HTMLElement;

  /**
   * Container for the image element in the UI.
   */
  imageContainer: HTMLElement;

  /**
   * Button for selecting files.
   */
  selectFileButton: HTMLElement;

  /**
   * Represents the image element in the UI, if one is present; otherwise, it's undefined.
   */
  imageEl?: HTMLElement;

  /**
   * Preloader element for the image.
   */
  imagePreloader: HTMLElement;

  /**
   * Caption element for the image.
   */
  caption: HTMLElement;

  /**
   * Width input element.
   */
  width: HTMLElement;

  /**
   * Height input element.
   */
  height: HTMLElement;

  /**
   * Wrapper for width and height inputs.
   */
  adjustWrapper: HTMLElement;

  /**
   * Upload-file button.
   */
  uploadFileButton: HTMLElement;

  /**
   * Spinner container for the image.
   */
  spinnerContainer: HTMLElement;

  /**
   * Button for increasing the size of the image.
   */
  sizeUpButton: HTMLElement;

  /**
   * Button for increasing the size of the image.
   */
  sizeDownButton: HTMLElement;
}

/**
 * ConstructorParams interface representing parameters for the Ui class constructor.
 */
interface ConstructorParams {
  /**
   * Editor.js API.
   */
  api: API;
  /**
   * Configuration for the image.
   */
  config: ImageConfig;
  /**
   * Callback function for selecting a file.
   */
  onSelectFile: () => void;
  /**
   * Callback function for uploading a file.
   */
  onUploadFile: () => void;
  /**
   * Callback function for resizing the image.
   */
  onResize: (type: "up" | "down") => void;
  /**
   * Flag indicating if the UI is in read-only mode.
   */
  readOnly: boolean;
}

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * Nodes representing various elements in the UI.
   */
  public nodes: Nodes;

  /**
   * API instance for Editor.js.
   */
  private api: API;

  /**
   * Configuration for the image tool.
   */
  private config: ImageConfig;

  /**
   * Callback function for selecting a file.
   */
  private onSelectFile: () => void;

  /**
   * Callback function for uploading a file.
   */
  private onUploadFile: () => void;

  /**
   * Callback function for resizing the image.
   */
  private onResize: (type: "up" | "down") => void;

  /**
   * Flag indicating if the UI is in read-only mode.
   */
  private readOnly: boolean;

  /**
   * @param ui - image tool Ui module
   * @param ui.api - Editor.js API
   * @param ui.config - user config
   * @param ui.onSelectFile - callback for clicks on Select file button
   * @param ui.readOnly - read-only mode flag
   */
  constructor({
    api,
    config,
    onSelectFile,
    onUploadFile,
    onResize,
    readOnly,
  }: ConstructorParams) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.onUploadFile = onUploadFile;
    this.onResize = onResize;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make("div", [this.CSS.imageContainer]),
      selectFileButton: this.createFileSelectButton(),
      imageEl: undefined,
      imagePreloader: make("div", [this.CSS.imagePreloader, "hidden"]),
      spinnerContainer: make("div", [
        "image-tool__spinner-container",
        "hidden",
      ]),
      caption: make("div", [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
      adjustWrapper: make("div", ["image-tool__dimensions", "hidden"]),
      width: make("input", "image-tool__dimension-input", {
        placeholder: "width",
      }),
      height: make("input", "image-tool__dimension-input", {
        placeholder: "height",
      }),
      uploadFileButton: this.createFileUploadButton(),
      sizeUpButton: this.createResizeButtons("up"),
      sizeDownButton: this.createResizeButtons("down"),
    };

    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    // Add the middle dot span
    const middleDot = make("span");
    this.nodes.spinnerContainer.appendChild(middleDot);
    this.nodes.imageContainer.appendChild(this.nodes.spinnerContainer);

    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);

    this.nodes.adjustWrapper.appendChild(this.nodes.width);
    const xIcon = make("div");
    xIcon.innerHTML = IconCross;
    this.nodes.adjustWrapper.appendChild(xIcon);
    this.nodes.adjustWrapper.appendChild(this.nodes.height);
    const sizeButtonGroup = make("div", "image-tool__size-button-group");
    sizeButtonGroup.appendChild(this.nodes.sizeUpButton);
    sizeButtonGroup.appendChild(this.nodes.sizeDownButton);
    this.nodes.adjustWrapper.appendChild(sizeButtonGroup);

    this.nodes.wrapper.appendChild(this.nodes.adjustWrapper);
    this.nodes.wrapper.appendChild(this.nodes.caption);
    this.nodes.wrapper.appendChild(this.nodes.selectFileButton);
    this.nodes.wrapper.appendChild(this.nodes.uploadFileButton);
  }

  /**
   * Apply visual representation of activated tune
   * @param tuneName - one of available tunes {@link Tunes.tunes}
   * @param status - true for enable, false for disable
   */
  public applyTune(tuneName: string, status: boolean): void {
    this.nodes.wrapper.classList.toggle(
      `${this.CSS.wrapper}--${tuneName}`,
      status
    );
  }

  /**
   * Renders tool UI
   * @param toolData - saved tool data
   */
  public render(toolData: ImageToolData): HTMLElement {
    if (
      toolData.file === undefined ||
      Object.keys(toolData.file).length === 0
    ) {
      this.toggleStatus(UiState.Empty);
    } else {
      this.toggleStatus(UiState.Uploading);
    }

    return this.nodes.wrapper;
  }

  /**
   * Shows uploading preloader
   * @param src - preview source
   */
  public showPreloader(src: string, width?: number, height?: number): void {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
    if (height) {
      (this.nodes.height as HTMLInputElement).value = height.toString();
    }
    if (width) {
      (this.nodes.width as HTMLInputElement).value = width.toString();
    }

    this.nodes.imagePreloader.classList.remove("hidden");
    this.nodes.adjustWrapper.classList.remove("hidden");
    this.nodes.uploadFileButton.classList.remove("hidden");

    this.toggleStatus(UiState.Uploading);
  }

  /**
   * Resizes the image
   * @param type - "up" or "down"
   */
  public resizeImage(type: "up" | "down"): void {
    const heightStr = (this.nodes.height as HTMLInputElement).value;
    const widthStr = (this.nodes.width as HTMLInputElement).value;

    if (heightStr && widthStr) {
      let height = parseInt(heightStr);
      let width = parseInt(widthStr);
      if (type === "up") {
        height *= 1.1;
        width *= 1.1;
      } else {
        height *= 0.9;
        width *= 0.9;
      }

      height = Math.round(height);
      width = Math.round(width);

      (this.nodes.height as HTMLInputElement).value = height.toString();
      (this.nodes.width as HTMLInputElement).value = width.toString();
      this.nodes.imagePreloader.style.backgroundSize = `${width}px ${height}px`;
    }
  }

  /**
   * Hide uploading preloader
   */
  public hidePreloader(): void {
    this.nodes.imagePreloader.classList.add("hidden");
    this.nodes.adjustWrapper.classList.add("hidden");
    this.nodes.uploadFileButton.classList.add("hidden");
    this.toggleStatus(UiState.Empty);
  }

  public showSpinner(): void {
    this.nodes.spinnerContainer.classList.remove("hidden");
  }

  public hideSpinner(): void {
    this.nodes.spinnerContainer.classList.add("hidden");
  }

  public getSize(): { width: number; height: number } {
    return {
      width: parseInt((this.nodes.width as HTMLInputElement).value),
      height: parseInt((this.nodes.height as HTMLInputElement).value),
    };
  }

  public hideTools(): void {
    this.nodes.imagePreloader.classList.add("hidden");
    this.nodes.adjustWrapper.classList.add("hidden");
    this.nodes.uploadFileButton.classList.add("hidden");
    this.nodes.selectFileButton.classList.add("hidden");
  }

  /**
   * Shows an image
   * @param url - image source
   */
  public fillImage(url: string): void {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = /\.mp4$/.test(url) ? "VIDEO" : "IMG";

    const attributes: { [key: string]: string | boolean } = {
      src: url,
    };

    /**
     * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
     * - IMG: load
     * - VIDEO: loadeddata
     */
    let eventName = "load";

    /**
     * Update attributes and eventName if source is a mp4 video
     */
    if (tag === "VIDEO") {
      /**
       * Add attributes for playing muted mp4 as a gif
       */
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;

      /**
       * Change event to be listened
       */
      eventName = "loadeddata";
    }

    /**
     * Compose tag with defined attributes
     */
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener(eventName, () => {
      this.toggleStatus(UiState.Filled);

      /**
       * Preloader does not exists on first rendering with presaved data
       */
      if (this.nodes.imagePreloader !== undefined) {
        this.nodes.imagePreloader.style.backgroundImage = "";
      }
    });

    this.nodes.imageContainer.appendChild(this.nodes.imageEl);
  }

  /**
   * Shows caption input
   * @param text - caption content text
   */
  public fillCaption(text: string): void {
    if (this.nodes.caption !== undefined) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * CSS classes
   */
  private get CSS(): Record<string, string> {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: "image-tool",
      imageContainer: "image-tool__image",
      imagePreloader: "image-tool__image-preloader",
      imageEl: "image-tool__image-picture",
      caption: "image-tool__caption",
      uploadButton: "image-tool__upload-button",
    };
  }

  /**
   * Creates select-file button
   */
  private createFileSelectButton(): HTMLElement {
    const button = make("div", [this.CSS.button]);

    button.innerHTML =
      this.config.buttonContent ??
      `${IconPicture} ${this.api.i18n.t("Select an Image")}`;

    button.addEventListener("click", () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Creates upload-file button
   */
  private createFileUploadButton(): HTMLElement {
    const button = make("div", [this.CSS.button, "hidden"]);

    button.innerHTML =
      this.config.buttonContent ??
      `${IconChevronUp} ${this.api.i18n.t("Upload")}`;

    button.addEventListener("click", () => {
      this.onUploadFile();
    });

    return button;
  }

  private createResizeButtons(type: "up" | "down"): HTMLElement {
    const button = make("div", "image-tool__size-button");
    if (type === "up") {
      button.innerHTML = "+";
    } else {
      button.innerHTML = "-";
    }

    button.addEventListener("click", () => {
      this.onResize(type);
    });
    return button;
  }

  /**
   * Changes UI status
   * @param status - see {@link Ui.status} constants
   */
  private toggleStatus(status: UiState): void {
    for (const statusType in UiState) {
      if (Object.prototype.hasOwnProperty.call(UiState, statusType)) {
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${UiState[statusType as keyof typeof UiState]}`,
          status === UiState[statusType as keyof typeof UiState]
        );
      }
    }
  }
}
