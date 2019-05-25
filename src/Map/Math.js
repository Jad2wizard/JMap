/**
 * Created by yaojia on 2019/5/25.
 */
export const clamp = (val, bottom, top) => {
    if(val < bottom)
        return bottom;
    if(val > top)
        return top;
    return val;
};

export const smoothstep = (bottom, top, val) => {
    if(val <= bottom)
        return 0.0;
    if(val > top)
        return 1.0;

    const t = ( val - bottom ) / ( top - bottom );

    return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
};

export const fade = (bottom, top, val) => {
    const mid = (bottom + top) / 2.0;
    const range = Math.abs(top - bottom) / 2.0;
    const x = 1.0 - clamp(Math.abs(mid - val) / range, 0.0, 1.0);

    return smoothstep(0.0, 1.0, x);
};
