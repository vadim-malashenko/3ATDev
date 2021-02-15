import Currency from './Currency.js'
import Pairs from './Pairs.js'

export default class Converter {

    #from
    #to
    #pairs
    #service
    #cache

    constructor(id, service) {

        this.#cache = {pairs: []}

        this.updateFrom = this.updateFrom.bind(this)
        this.updateTo = this.updateTo.bind(this)
        this.pair = this.pair.bind(this)

        this.#service = service
        Currency.service = {list: service.list, top10: service.top10}
        Pairs.service = {list: service.pairs}

        const from = `${id}_from`
        const to = `${id}_to`
        const pairs = `${id}_pairs`

        const container = document.getElementById(id) || document.body
        const currenciesContainer = container.querySelector(':scope .currencies')
        const pairsContainer = container.querySelector(':scope .pairs')

        currenciesContainer.innerHTML = `${Currency.CONTAINER_TEMPLATE(from)}${Currency.CONTAINER_TEMPLATE(to)}`
        pairsContainer.innerHTML = Pairs.CONTAINER_TEMPLATE(pairs)

        this.#from = new Currency(from, this.#service.top10[0])
        this.#to = new Currency(to, this.#service.top10[1])
        this.#pairs = new Pairs(pairs)

        Currency.waitAny([`${to}.amount.change`], this.updateFrom)
        Currency.waitAny([`${from}.amount.change`, `${from}.symbol.change`, `${to}.symbol.change`], this.updateTo)
        Pairs.waitAny([`${pairs}.click`], this.pair)
    }

    updateFrom() {

        const from = this.#service.list.find(c => c.symbol === this.#to.symbol)
        const to = this.#service.list.find(c => c.symbol === this.#from.symbol)

        this.#from.amount = this.#to.amount * from.price / to.price

        const hash = btoa(JSON.stringify({amount: this.#from.amount, from: to.symbol, to: from.symbol}))

        if (typeof this.#cache[hash] === 'undefined') {

            if (Converter.post(hash)) {
                this.#cache[hash] = true
            }
        }
    }

    updateTo() {

        const from = this.#service.list.find(c => c.symbol === this.#from.symbol)
        const to = this.#service.list.find(c => c.symbol === this.#to.symbol)

        this.#to.amount = this.#from.amount * from.price / to.price

        const hash = btoa(JSON.stringify({amount: this.#from.amount, from: from.symbol, to: to.symbol}))

        if (typeof this.#cache[hash] === 'undefined') {

            if (Converter.post(hash)) {
                this.#cache[hash] = true
            }
        }
    }

    pair(ev)  {

        const {amount, from, to} = ev.detail

        this.#from.amount = amount
        this.#from.symbol = this.#service.list.find(c => c.symbol === from)
        this.#to.symbol = this.#service.list.find(c => c.symbol === to)

        this.updateTo()
    }

    static async post(hash) {

        const pair = {
            action: converter.action,
            method: 'pair',
            _wpnonce: converter.nonce,
            pair: hash
        }

        const method = 'post'
        const body = new URLSearchParams(pair);

        const promise = await fetch(converter.url, {method, body})
        const response = await promise.json()

        return response
    }

    static load(id) {

        return async ev => {

            const promise = await fetch(`${converter.url}?action=${converter.action}&method=prices&_wpnonce=${converter.nonce}`)
            const response = await promise.json()

            const list = response.list
            const pairs = response.pairs

            const top10 = list.sort((a, b) => a.id - b.id).slice(0, 10)

            converter.instance = new Converter(id, {list, top10, pairs})
        }
    }
}