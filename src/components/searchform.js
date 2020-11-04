import React, {Component} from 'react';
import search from '../static/search.svg';
import currentrooturl from '../url';
import utility from '../methods/utility.js';
import history from '../methods/history.js';

// Searchform within navbar
export default class SearchForm extends Component {
    constructor(props) {
        super();
        this.searchTermRef = React.createRef();
    }


    hoverShow = (e, name, enterexit) => {
        if (name == "search") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-search").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-search").classList.remove("visible");
            }
        }
    }

    // All of this should be removed and put on a search results page. See results.js
    submitSearch = (e) => {
//        e.preventDefault();
//        if (utility.get(this, 'searchTermRef.current.value')) {
//            let searchVal = this.searchTermRef.current.value;
//            history.push("search?s=" + searchVal);
//            fetch(currentrooturl + 'm/search?s=' + searchVal, {
//                method: "GET",
//                headers: {
//                    'Accept': 'application/json',
//                    'Content-Type': 'application/json'
//                },
//                mode: 'same-origin',
//                credentials: 'include'
//            })
//            .then((response) => {
//                return response.json(); // Parsed data
//            })
//            .then((data) => {
//                console.log(data);
//                return data;
//            })
//            .catch(error => {
//                console.log(error);
//            })
//        }
    }

    render() {
        return (
            <form className="search-form-flex" method="GET" action="/search" onSubmit={(e) => {this.submitSearch(e)}}>
                <input className="search-field" id="search" type="search" ref={this.searchTermRef} placeholder="Search.." name="s"></input>
                <button className="searchbox" type="submit" value="submit" onMouseOver={(e) => {this.hoverShow(e, "search", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "search", "exit")}}>
                    <i className="material-icons search material-icon-search">search</i>
                    <div className="btn-desc btn-desc-search">search</div>
                </button>
            </form>
        );
    }
};
