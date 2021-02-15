export default class Currency {

    static CONTAINER_TEMPLATE = id => `
        <div class="col-lg-6 col-md-6 col-12" id="${id}">
            <div class="input-group flex-nowrap">
                <input class="amount form-control shadow-none rounded-0 form-control-lg" pattern="(\\d+(\\.|,)*)+" />
                <button class="symbol btn dropdown-toggle shadow-none rounded-0 bg-white" data-bs-toggle="dropdown" aria-expanded="false" style="border:1px solid #ced4da"></button>
                <div class="dropdown-menu dropdown-menu-end bg-light rounded-0 mt-1 p-2 w-100" aria-labelledby="dropdownMenuButton2">
                    <div class="input-group">
                            <span class="input-group-text rounded-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13px" height="13px"viewBox="0 0 13 13">
                                    <path fill="#c1bebe" d="M5.055 0a5.062 5.062 0 0 1 5.054 5.055c0 1.21-.424 2.32-1.137 3.19L13 12.273l-.727.727-4.028-4.028a5.015 5.015 0 0 1-3.19 1.137A5.062 5.062 0 0 1 0 5.055 5.062 5.062 0 0 1 5.055 0zm0 1.01A4.036 4.036 0 0 0 1.01 5.056a4.036 4.036 0 0 0 4.044 4.043 4.036 4.036 0 0 0 4.043-4.043A4.036 4.036 0 0 0 5.055 1.01z"></path>
                                </svg>
                            </span>
                        <input class="search form-control shadow-none rounded-0 form-control-sm" />
                    </div>
                    <div class="list list-group list-group-flush rounded-0 mt-2" style="overflow-y:scroll; max-height:75vh"></div>
                </div>
            </div>
        </div>
    `

    static SYMBOL_TEMPLATE = currency => `
        <img class="mb-1" src="https://s2.coinmarketcap.com/static/img/coins/16x16/${currency.id}.png" style="display: inline"/>
        <span class="mx-2">${currency.symbol}</span>
    `

    static SYMBOL_LIST_ITEM_TEMPLATE = currency => `
        <a class="list-group-item list-group-item-action d-flex" href="javascript:void(0)">
            <div>${Currency.SYMBOL_TEMPLATE(currency)}</div>
            <div>${currency.name}</div>
        </a>
    `

    static service
    
    #id
    #amount
    #symbol
    #search
    #list

    constructor(id, currency) {

        this.#id = id

        const container = document.getElementById(id)

        this.#amount = container.querySelector(':scope .amount')
        this.#symbol = container.querySelector(':scope .symbol')
        this.#search = container.querySelector(':scope .search')
        this.#list = container.querySelector(':scope .list')

        this.#symbol.insertAdjacentHTML('beforeend', Currency.SYMBOL_TEMPLATE(currency))

        this.symbolUpdate = this.symbolUpdate.bind(this)
        this.symbolListUpdate = this.symbolListUpdate.bind(this)
        this.valueChange = this.valueChange.bind(this)

        container.addEventListener('shown.bs.dropdown', this.symbolListUpdate)
        this.#search.addEventListener('keyup', this.symbolListUpdate)
        this.#amount.addEventListener('keyup', this.valueChange)

        this.amount = 0
    }

    float(value) {

        value = + value

        const int = parseInt(value, 10)
        const float = parseFloat(value)

        return int === float ? float : float.toFixed(6)
    }

    get amount() {
        return this.float(this.#amount.value)
    }

    set amount(value) {
        this.#amount.value = this.float(value)
    }

    get symbol() {
        return this.#symbol.querySelector(':scope span').innerText
    }

    set symbol(currency) {

        const img = this.#symbol.querySelector(':scope img')

        img.src = img.src.replace(/\d+(?=(\.png))/, currency.id)
        this.#symbol.querySelector(':scope span').innerText = currency.symbol
    }

    valueChange (ev) {

        if (this.#amount.value.length > 0) {

            const amount = parseFloat(this.#amount.value)

            if (!isNaN(amount)) {

                ev.target.classList.remove('is-invalid')

                if (amount > 0) {
                    dispatchEvent(new CustomEvent(`${this.#id}.amount.change`))
                }
            } else {
                ev.target.classList.add('is-invalid')
            }
        }
    }

    symbolListUpdate (ev) {

        const symbol = this.#search.value.toLowerCase()

        ;this.#list.innerHTML = (symbol.length > 0 ? Currency.service.list.filter(a => a.symbol.toLowerCase().startsWith(symbol) || a.name.toLowerCase().startsWith(symbol)) : Currency.service.top10).reduce((a, c) => a + Currency.SYMBOL_LIST_ITEM_TEMPLATE(c), '')
        ;[... this.#list.querySelectorAll(':scope a')].forEach(a => a.addEventListener('click', this.symbolUpdate))
    }

    symbolUpdate(ev) {

        const a = ev.composedPath().find(p => p.tagName === 'A')

        if (typeof a !== 'undefined') {

            this.#symbol.innerHTML = a.querySelector(':scope div').innerHTML
            dispatchEvent(new CustomEvent(`${this.#id}.symbol.change`))
        }
    }

    static waitAny(events, fn) {

        Promise.any(events.map(ev => new Promise(resolve => window.addEventListener(ev, resolve))))
            .then(ev => {
                fn(ev)
                Currency.waitAny(events, fn)
            })
    }
}