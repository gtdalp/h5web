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
        var self = this;
        self.options = {
            id: o.id,
            confirm: o.confirm,
            cancel: o.cancel,
            adapter: o.adapter,
            url: o.url, // 请求数据接口
            type: o.type || 'get',
            selected: o.selected || {},
            isClick: true            
        };
        self.options.newSelected = {       // 新选中的省市区
            provinceKey: self.options.selected.provinceKey || '',
            cityKey: self.options.selected.cityKey || '',
            areaKey: self.options.selected.areaKey || ''
        };
        self.show = function(){
            var $address = $('#' + self.options.id + '-article');
            $address.removeClass('dn').addClass('address-slideInUp');
        },
        self.hide = function(){
            // 重置
            self.options.newSelected = self.options.preNewSelected;
            self.__createProvinceTemplate();
            self.__createCityTemplate();
            self.__createAreaTemplate('', 'resetfirstData');

            var $address = $('#' + self.options.id + '-article');
            $address.addClass('address-slideOutDown');
            setTimeout(function() {
                $address.addClass('dn').removeClass('address-slideOutDown address-slideInUp');
            }, 401);
            
        }
    },
    __event: function () {
        var self = this
            , op = self.options
            , id = op.id
            , confirm = op.confirm
            , cancel = op.cancel
            ;
        $('#' + id + '-article a').on('click', function () {
            var dom = $(this);
            // 禁止滚动中点击
            if ( !op.isClick ) return;
            if ( dom.hasClass( 'cancel' ) ) {
                if( $.isFunction(cancel) ){
                    cancel();
                }
            } else if ( dom.hasClass( 'confirm' ) ) {
                self.__setAttrData();
                if( $.isFunction(confirm) ){
                    var newSelected = op.newSelected;
                    op.newSelected.address = newSelected.provinceValue + ' ' + newSelected.cityValue + ' ' + newSelected.areaValue.replace('--', '');
                    confirm(op.newSelected);
                }
            }
            self.hide();
        });
    },
    __render: function (o) {
        var self = this;
        self.__init(o);
        self.__createIscroll();
        self.__event();
    },
    __createIscroll: function () {
        var self = this
            , id = self.options.id
            , _html = '\
            <article class="widget-ui-address-article hide-address" id="' + id + '-article"><div class="widget-ui-address-header" id="' + id + '-header"><a href="javascript:void(0);" class="cancel l">取消</a><a href="javascript:void(0);" class="confirm r">确定</a></div>\
            <section class="widget-ui-address" id="' + id + '">\
                <div class="widget-ui-address-province widget-ui-address-select" id="' + id + '-province"><ul class="widget-ui-address-scroll"></ul></div>\
                <div class="widget-ui-address-city widget-ui-address-select" id="' + id + '-city"><ul class="widget-ui-address-scroll"></ul></div>\
                <div class="widget-ui-address-area widget-ui-address-select" id="' + id + '-area"><ul class="widget-ui-address-scroll"></ul></div>\
            </section></article>';
        $('body').append(_html);
        self.__setData();
        id = '#' + id + '-';
        self.options._is_province = new IScroll(id + 'province');
        self.options._is_city = new IScroll(id + 'city');
        self.options._is_area = new IScroll(id + 'area');
        // 省
        self.__scrollStart('province');
        self.__scrollEnd('province');
        // 市
        self.__scrollStart('city');
        self.__scrollEnd('city');
        // 区
        self.__scrollStart('area');
        self.__scrollEnd('area');
    },
    __getScroll: function (str) {
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
        return _is;
    },
    __scrollStart: function ( str ) {
        var self = this
            , _is = self.__getScroll(str)
            ;
        _is.on('scrollStart', function () {
            self.options.isClick = false;
        });
    },
    __scrollEnd: function (str) {
        var self = this
            , _is = this.__getScroll(str)
            ;
        _is.on('scrollEnd', function () {
            var _is_self = this
                , y = Math.abs(_is_self.y)
                , li = $(_is_self.scroller).find('li')
                , liHeight = li.height()
                , index = Math.round(y / liHeight)
                , seletedLi = li.eq(index)
                , key = seletedLi.attr('data-key')
                , value = seletedLi.text()
                , newSelected = self.options.newSelected
                , top = y%liHeight
                ;
            // 重新设置省
            newSelected[str + 'Key'] = key;
            newSelected[str + 'Value'] = value;
            if ( str === 'province' ) {
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
            _is_self.scrollTo(0, -index*liHeight, 400);
            self.options.isClick = true;
        });
    },
    __renderUl: function ( str ) {
        return $('#' + this.options.id).find('div.widget-ui-address-' + str + ' ul.widget-ui-address-scroll')
    },
    __setData: function () {
        var self = this
            , op = self.options
            , adapter = op.adapter
            ;
        var _getDataSuccess = function (data) {
            // 格式化数据
            if( $.isFunction( adapter ) ){
                data = adapter( data );
            }
            op.data = {list: data};

            // 初始化模板
            self.__createProvinceTemplate();
            self.__createCityTemplate();
            self.__createAreaTemplate('', 'firstData');
        }
        if( op.url ){
            $.ajax({
                url: op.url,
                type: op.type,
                success: _getDataSuccess,
                error: function () {
                    alert('获取地址失败');
                    // Alert({title : '获取地址失败'});
                }
            });
        } else {
            getAddressData().then( _getDataSuccess );
        }
        
    },
    __eachLi: function ( ul, str, _is, cb, firstData ) {
        var li = ul.find('li')
            , length = li.length
            , op = this.options
            , _str = str + 'Key'
            , _key = op.newSelected[_str]
            , selected = 0
            ;
        _is.refresh();
        _is.scrollTo(0, 0, 0);

        li.each(function () {
            var _this = $(this)
                , key = _this.attr('data-key')
                , value = _this.text()
                ;
            if ( key === _key ) {
                var index =_this.index()
                    , liHeight = _this.height()
                    , top = -index * liHeight
                    ;
                op.newSelected[ str + 'Value'] = value;
                _is.scrollTo(0, top, 0);
            }else{
                // 查找不到指定的数据就选择第一个值
                selected++;
            }
        });
        // 重新设置
        if ( _key === '' || selected === length ) {
            op.newSelected[_str] = li.eq(0).attr('data-key');
            op.newSelected[ str + 'Value'] = li.eq(0).text();
        }
        if ( $.isFunction(cb) ){
            cb(op.newSelected[_str]);
        }
        // 第一次load数据需要隐藏容器(为了获取高度，display:none之后获取不到高度)
        if( firstData === 'firstData' || firstData === 'resetfirstData'){
            if ( firstData === 'firstData' ) $('#' + op.id + '-article').removeClass('hide-address').addClass('dn');
            var confirm = op.confirm;
            if( $.isFunction(confirm) ){
                var newSelected = op.newSelected;
                op.newSelected.address = newSelected.provinceValue + ' ' + newSelected.cityValue + ' ' + newSelected.areaValue.replace('--', '');
                confirm(op.newSelected);
            }
            this.__setAttrData();
        }
    },
    __setAttrData: function () {
        var self = this
            , op = self.options
            , newSelected = op.newSelected
            ;
        self.options.preNewSelected = {
            areaKey: newSelected.areaKey,
            areaValue: newSelected.areaValue,
            cityKey: newSelected.cityKey,
            cityValue: newSelected.cityValue,
            provinceKey: newSelected.provinceKey,
            provinceValue: newSelected.provinceValue,
            address: newSelected.address
        };
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
    __createAreaTemplate: function (parentKey, firstData) {
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
        self.__eachLi( ul, 'area', _is, '', firstData );
    }
}

module.exports = Address;