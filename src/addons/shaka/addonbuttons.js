import { get } from '../../methods/utility.js';
import { cookies } from '../../App.js';

const shaka = require('shaka-player/dist/shaka-player.ui.js');

export const nextSeries = function() {
    shaka.ui.theatreButton = class extends shaka.ui.Element {
        constructor(parent, controls) {
            super(parent, controls);
            this.button_ = document.createElement('button');
            this.button_.classList.add('crop_7_5', 'material-icons', 'shaka-generic-button', 'crop-btn');
            this.button_.textContent = 'crop_7_5';
            this.parent.appendChild(this.button_);
            this.eventManager.listen(this.button_, 'click', () => {
                try {
                    if (get(this, 'parent.parentElement.parentElement.parentElement.parentElement')) {
                        let container = this.parent.parentElement.parentElement.parentElement.parentElement;
                        let maindash;
                        if (document.getElementsByClassName('maindash')[0]) {
                            maindash = document.getElementsByClassName('maindash')[0];
                        }
                        // The following will update the appropriate elements when the user clicks the crop button
                        if (!container.classList.contains('wide-screen')) {
                            container.classList.add('wide-screen');
                            this.button_.classList.remove('crop_7_5');
                            this.button_.classList.add('crop_square');
                            this.button_.innerHTML = 'crop_square';
                            if (maindash) {
                                maindash.classList.add('maindash-video-wide');
                            }
                            cookies.set('video-wide', true);
                        } else {
                            container.classList.remove('wide-screen');
                            this.button_.classList.remove('crop_square');
                            this.button_.classList.add('crop_7_5');
                            this.button_.innerHTML = 'crop_7_5';
                            if (maindash) {
                                maindash.classList.remove('maindash-video-wide');
                            }
                            cookies.set('video-wide', false);
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
    shaka.ui.coverButton = class extends shaka.ui.Element {
        constructor(parent, controls) {
            super(parent, controls);
            this.button_ = document.createElement('button');
            this.button_.classList.add('crop', 'material-icons', 'shaka-generic-button', 'cover-btn');
            this.button_.textContent = 'crop';
            this.parent.appendChild(this.button_);
            if (!cookies.get('video-cover')) {
                cookies.set('video-cover', false);
            }
            if (get(this, 'parent.parentElement.parentElement.parentElement')) {
                let container = this.parent.parentElement.parentElement.parentElement;
                if (cookies.get('video-cover') == "false") {
                    container.classList.remove('cover');
                } else {
                    container.classList.add('cover');
                }
            }
            this.eventManager.listen(this.button_, 'click', () => {
                try {
                    if (get(this, 'parent.parentElement.parentElement.parentElement')) {
                        let container = this.parent.parentElement.parentElement.parentElement;
                        if (cookies.get('video-cover') == "false") {
                            container.classList.add('cover');
                            cookies.set('video-cover', true);
                        } else {
                            container.classList.remove('cover');
                            cookies.set('video-cover', false);
                        }
                    }
                } catch (err) {
                    console.log(err);        
                }
            })
        }
    }
    shaka.ui.theatreButton.Factory = class {
        create(rootElement, controls) {
            return new shaka.ui.theatreButton(rootElement, controls);
        }
    };
    shaka.ui.coverButton.Factory = class {
        create(rootElement, controls) {
            return new shaka.ui.coverButton(rootElement, controls);
        }
    }
    shaka.ui.Controls.registerElement('theatreButton', new shaka.ui.theatreButton.Factory());
    shaka.ui.Controls.registerElement('coverButton', new shaka.ui.coverButton.Factory());
}
