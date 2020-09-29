import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

// Will remove all link nodes from body of html
function transform(node) {
    if (node.name === 'a') {
        return null;
    }
}

const parseBody = function(body, length, removeLinks = false) {
    if (body) {
        let options = {};
        if (removeLinks) {
            options = { transform };
        }
        let html = "";
        if (length) {
            if (body.length < length) {
                html = ReactHtmlParser(body, options);
            } else {
                html = ReactHtmlParser(body.slice(0, length), options);
                if (html[html.length-1].type != "figure") { // If last node type figure do not add ellipsis will produce undefined text
                    html[html.length-1].props.children[0] += "..";
                }
            }
        } else {
            html = ReactHtmlParser(body);
        }
        return html;
    }
    return body;
}

export default parseBody;
