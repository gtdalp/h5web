var Address = require('../../widget/address');

var address = new Address({
	id: 'address',
	url: 'data/address.json', // 请求数据接口
	type: 'get',    // 默认get
	// adapter: function ( data ){ // 格式化数据
	// 	console.log(data)
	// 	return data;
	// },
	selected: {  // 默认选中
		provinceKey: '320000',
		cityKey: '320300',
		areaKey: '320311'
	},
	cancel: function () {  // 取消
		//
	},
	confirm: function (data) { // 确认地址
		console.log(data)
	}
});

// document.getElementById('body').style.display = '';
// document.getElementById('loading-body').style.display = 'none';
