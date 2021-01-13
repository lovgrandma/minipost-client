import { get } from '../../methods/utility.js';

const shaka = require('shaka-player/dist/shaka-player.ui.js');

export const nextSeries = function() {
    shaka.ui.theatreButton = class extends shaka.ui.Element {
        constructor(parent, controls) {
            super(parent, controls);
            this.button_ = document.createElement('button');
            this.button_.classList.add('crop_7_5', 'material-icons', 'shaka-generic-button');
            this.button_.textContent = 'crop_7_5';
            this.parent.appendChild(this.button_);
            this.eventManager.listen(this.button_, 'click', () => {
                try {
                    if (get(this, 'parent.parentElement.parentElement.parentElement.parentElement')) {
                        let container = this.parent.parentElement.parentElement.parentElement.parentElement;
                        if (!container.classList.contains('wide-screen')) {
                            container.classList.add('wide-screen');
                            this.button_.classList.remove('crop_7_5');
                            this.button_.classList.add('crop_square');
                            this.button_.innerHTML = 'crop_square';
                        } else {
                            container.classList.remove('wide-screen');
                            this.button_.classList.remove('crop_square');
                            this.button_.classList.add('crop_7_5');
                            this.button_.innerHTML = 'crop_7_5';
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
    shaka.ui.theatreButton.Factory = class {
        create(rootElement, controls) {
            return new shaka.ui.theatreButton(rootElement, controls);
        }
    };
    shaka.ui.Controls.registerElement('theatreButton', new shaka.ui.theatreButton.Factory());
}
