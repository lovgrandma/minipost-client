import React, {Component} from 'react';
import search from '../static/search-white.svg';

// Searchform within navbar
export default class SearchForm extends Component {
    render() {
        let getInnerSearchText = 'Search..';

        return (
        <form className="search-form-flex" method="GET" action="/search">
            <input className="search-field" id="search" type="search" placeholder={getInnerSearchText} name="search"></input>
            <button className="searchbox" type="submit" value="submit">
                <img className="search" src={search} alt="search"></img>
            </button>
        </form>
        );
    }
};
