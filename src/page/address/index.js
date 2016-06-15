var Address = require('../../widget/address');
var $ = require('jquery');
var address = new Address({
	id: 'address',
	// url: 'data/address.json', // 请求数据接口
	type: 'get',    // 默认get
	// adapter: function ( data ){ // 格式化数据
	// 	console.log(data)
	// 	return data;
	// },
	adapter: function ( data ){ // 格式化数据
		// console.log(data)
		return data;
	},
	selected: {  // 默认选中
		provinceKey: '440000',
		cityKey: '440300',
		areaKey: '440305'
	},
	cancel: function () {  // 取消
		//
	},
	confirm: function (data) { // 确认地址
		console.log(data)
		var address = data.address;
		$('#default-address').html(address);
	}
});
var receiptAddress = new Address({
	id: 'receiptAddress',
	confirm: function (data) { // 确认地址
		console.log(data)
		var address = data.address;
		$('#receipt-address').html(address);
	}
});
$('#default-address').on('click', function() {
	// 显示
	address.show();
});
$('#receipt-address').on('click', function() {
	// 显示
	receiptAddress.show();
});
