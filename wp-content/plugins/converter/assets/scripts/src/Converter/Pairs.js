export default class Pairs {

    static CONTAINER_TEMPLATE = id => `
        <div class="col-12" id="${id}">
            <div class="list-group"></div>
        </div>
    `

    static ITEM_TEMPLATE = pair => {
        const date = new Date(pair.timestamp * 1000)
        return `
            <div class="list-group-item d-flex">
                <a class="pair" href="javascript:void(0)">${pair.amount} ${pair.from} to ${pair.to}</a>
                <div class="ms-auto">${date.toLocaleDateString('en-US')} ${date.toLocaleTimeString('en-US')}</div>
            </div>
        `
    }

    static service

    #id

    constructor(id) {

        this.#id = id

        this.onclick = this.onclick.bind(this)

        const container = document.getElementById(id)
        const list = container.querySelector(':scope .list-group')

        Pairs.service.list.forEach(pair => list.insertAdjacentHTML('beforeend', Pairs.ITEM_TEMPLATE(pair)))
        ;[...container.querySelectorAll(':scope a.pair')].forEach(a => a.addEventListener('click', this.onclick))
    }

    onclick(ev) {

        const match = ev.target.innerText.match(/(?<amount>\d+([.,]\d+)*) (?<from>\w+) to (?<to>\w+)/)
        dispatchEvent(new CustomEvent(`${this.#id}.click`, {detail: match.groups}))
    }

    static waitAny(events, fn) {

        Promise.any(events.map(ev => new Promise(resolve => window.addEventListener(ev, resolve))))
            .then(ev => {
                fn(ev)
                Pairs.waitAny(events, fn)
            })
    }
}