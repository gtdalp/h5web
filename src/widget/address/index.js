// 加载样式
require('../../css/animate.css');
require('./index.css');

// 加载依赖库
var juicer = require('juicer');
var $ = require('jquery');
var IScroll = require('iscroll');

// 省市区数据
var getAddressData = require('promise?bluebird!./data.json');

var Address = function(o){
    this.__render(o);
}

Address.prototype = {
    version: '1.0.0',
    __init: function (o) {
        this.options = {
            id: o.id,
            confirm: o.confirm,
            cancel: o.cancel,
            adapter: o.adapter,
            url: o.url || 'list.json', // 请求数据接口
            type: o.type || 'get',
            selected: o.selected || {}                
        };
        this.options.newSelected = {       // 新选中的省市区
            provinceKey: this.options.selected.provinceKey || '',
            cityKey: this.options.selected.cityKey || '',
            areaKey: this.options.selected.areaKey || ''
        }
    },
    __render: function (o) {
        var self = this;
        self.__init(o);
        self.__createIscroll();
    },
    __createIscroll: function () {
        var self = this
            , obj = {snap: true}
            , id = self.options.id
            , _html = '\
            <article class="widget-ui-address-article" id="' + id + '-article"><div class="widget-ui-address-header" id="' + id + '-header"><a href="javascript:void(0);" class="cancel l">取消</a><a href="javascript:void(0);" class="confirm r">确定</a></div>\
            <section class="widget-ui-address" id="' + id + '">\
                <div class="widget-ui-address-province widget-ui-address-select" id="' + id + '-province"><ul class="widget-ui-address-scroll"></ul></div>\
                <div class="widget-ui-address-city widget-ui-address-select" id="' + id + '-city"><ul class="widget-ui-address-scroll"></ul></div>\
                <div class="widget-ui-address-area widget-ui-address-select" id="' + id + '-area"><ul class="widget-ui-address-scroll"></ul></div>\
            </section></article>';
        $('body').append(_html);
        self.__setData();

        self.options._is_province = new IScroll('#' + id + '-province', obj);
        self.options._is_city = new IScroll('#' + id + '-city', obj);
        self.options._is_area = new IScroll('#' + id + '-area', obj);
        // 省
        self.__scrollEnd('province');
        // 市
        self.__scrollEnd('city');
        // 区
        self.__scrollEnd('area');
    },
    __scrollEnd: function (str) {
        var self = this
            , _is = null
            ;
        if ( str === 'province' ) {
            _is = self.options._is_province;
        } else if( str === 'city' ) {
            _is = self.options._is_city;
        } else if ( str === 'area' ) {
            _is = self.options._is_area;
        }
        _is.on('scrollEnd', function () {
            var _is_self = this
                , y = Math.abs(_is_self.y)
                , li = $(_is_self.scroller).find('li')
                , liHeight = li.height()
                , index = y / liHeight
                , seletedLi = li.eq(index)
                , key = seletedLi.attr('data-key')
                , value = seletedLi.text()
                , newSelected = self.options.newSelected
                ;
            // 重新设置省
            newSelected[str + 'Key'] = key;
            newSelected[str + 'Value'] = value;
            if ( str === 'province' ) {
                // console.log(newSelected)
                // 创建市
                self.__createCityTemplate(key, function (cityKey) {
                    // 创建区
                    self.__createAreaTemplate(cityKey);
                });
            } else if( str === 'city' ) {
                // 创建区
                self.__createAreaTemplate(key);
            } else if ( str === 'area' ) {
                // console.log(newSelected)
            }
        });
    },
    __renderUl: function ( str ) {
        return $('#' + this.options.id).find('div.widget-ui-address-' + str + ' ul.widget-ui-address-scroll')
    },
    // 获取数据
    __setData: function () {
        var self = this
            , op = self.options
            , newSelected = op.newSelected
            ;
        // 异步加载地区数据，减小入口文件大小
        setTimeout(function(){
            getAddressData().then(function(data){

                var adapter = op.adapter;
                // 格式化数据
                if( $.isFunction( adapter ) ){
                    data = adapter( data );
                }
                op.data = {list: data};
                // 初始化模板
                self.__createProvinceTemplate();
                self.__createCityTemplate();
                self.__createAreaTemplate();
            });
        }, 100);
    },
    __eachLi: function ( ul, str, _is, cb ) {
        var li = ul.find('li')
            , length = li.length
            , op = this.options
            , _key = op.newSelected[ str + 'Key']
            , selected = 0
            ;
        _is.refresh();
        _is.scrollTo(0, 0, 0);

        li.each(function () {
            var _this = $(this)
                , key = _this.attr('data-key')
                ;
            if ( key === _key ) {
                var index =_this.index()
                    , liHeight = _this.height()
                    , top = -index * liHeight
                    ;
                _is.scrollTo(0, top, 0);
            }else{
                // 查找不到指定的数据就选择第一个值
                selected++;
            }
        });
        // 重新设置
        if ( _key === '' || selected === length ) {
            op.newSelected[ str + 'Key'] = li.eq(0).attr('data-key');
        }
        if( str === 'area'){
            console.log('area')
        }
        if ( $.isFunction(cb) ){
            cb(op.newSelected[ str + 'Key']);
        }
    },
    __createProvinceTemplate: function () {
        var self = this
            , op = self.options
            , data = op.data
            , _is = op._is_province
            , _html = '{@each list as it}{@if !it.parentKey}<li data-key="${it.key}">${it.name}</li>{@/if}{@/each}'
            , _tpl = juicer(_html, data)
            , ul = self.__renderUl('province')
            ;
        
        ul.html(_tpl);
        // 定位
        self.__eachLi( ul, 'province', _is );
    },
    __createCityTemplate: function (parentKey, cb) {
        var self = this
            , op = self.options
            , provinceKey = op.newSelected.provinceKey
            , cityKey = op.newSelected.cityKey
            , parentKey = parentKey || cityKey
            , data = op.data
            ;
        // 市要跟省份对上
        parentKey = provinceKey != parentKey ? provinceKey : parentKey;

        var _html = '{@each list as it}{@if it.parentKey == "' + parentKey + '"}<li data-parentKey="' + parentKey + '" data-key="${it.key}">${it.name}</li>{@/if}{@/each}'
            , _tpl = juicer(_html, data)
            , ul = self.__renderUl('city')
            , _is = op._is_city
            ;

        ul.html(_tpl);
        // 定位
        self.__eachLi( ul, 'city', _is, cb );
    },
    __createAreaTemplate: function (parentKey) {
        var self = this
            , op = self.options
            , cityKey = op.newSelected.cityKey
            , areaKey = op.newSelected.areaKey
            , parentKey = parentKey || areaKey
            , data = op.data
            ;
        // 市要跟省份对上
        parentKey = cityKey != parentKey ? cityKey : parentKey;

        var _html = '{@each list as it}{@if it.parentKey == "' + parentKey + '"}<li data-parentKey="' + parentKey + '" data-key="${it.key}">${it.name}</li>{@/if}{@/each}'
            , _tpl = juicer(_html, data)
            , ul = self.__renderUl('area')
            , _is = op._is_area
            ;
        ul.html(_tpl);
        // 定位
        self.__eachLi( ul, 'area', _is );
    }
};

module.exports = Address;