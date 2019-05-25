/**
 * Created by yaojia on 2019/5/25.
 */
if(!Array.prototype._mul){
    Array.prototype._mul = function(num){
        for(let i = 0; i < this.length; i++){
            this[i] *= num;
        }
        return this;
    }
}

if(!Array.prototype._add){
    Array.prototype._add = function(arr){
        if(arr.length !== this.length)
            return this;
        for(let i = 0; i < arr.length; ++i){
            this[i] += arr[i];
        }
        return this;
    }
}
