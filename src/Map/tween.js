import _TWEEN from '@tweenjs/tween.js'

export const tweenWrap = ({
    start,
    end,
    delay = 1000,
    onUpdate = () => {},
    onEnd = () => {}
}) => {
    const tween = new _TWEEN.Tween(start)
        .to(end, delay)
        .onUpdate(onUpdate)
        .onComplete(onEnd)
        .start()

    return tween
}

export const TWEEN = _TWEEN
