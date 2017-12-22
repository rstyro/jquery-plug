/**
 * initComment()			是初始化评论列表
 * 		参数：
 * 			data:			评论的数据列表，评论对象的数组
 * 			floorNum:		第几楼
 * 			userName:		当前评论的用户名称
 * 			reply_method:	回复方法的回调方法名称--
 * 			praise_method:	点赞方法的回调方法名称--
 * comment()				评论方法	
 * 		参数：
 * 			obj:			评论的对象
 *			floorNum:		第几楼
 *			userName:		当前评论的用户名称	
 *			comment_method: 评论方法的回调方法名称
 *			reply_method:	回复方法的回调方法名称
 *			praise_method:	点赞方法的回调方法名称
 * 
 * 
 * getCommentBody() 		获取评论体数据的方法，当执行回调方法时调用
 * 
 * */
(function($){
	var commentBody=new Object();
	var replyName="";
	//初始化评论
	$.fn.initComment=function(options){
		var defaults = {
				data:[],
				floorNum:1,
				userName:"帅大叔",
				reply_method:"addReplyRequest",
				praise_method:"praiseRequest"
		}
		var option = $.extend(defaults, options);
		var userName = option.userName;
		var floorNum = option.floorNum;
		var reply_method = option.reply_method;
		var praise_method = option.praise_method;
		var arr = option.data;
		if(typeof(arr) != "undefined" && arr.length>0){
			for(var i=0;i<arr.length;i++){
				floorNum = addComment($(this),arr[i],floorNum,userName,reply_method,praise_method);
			}
		}
		return floorNum;
	}
	//评论
	$.fn.comment=function(options){
		var defaults = {
			obj:{},
			floorNum:1,
			userName:"帅大叔",
			comment_method:"addCommentRequest",
			reply_method:"addReplyRequest",
			praise_method:"praiseRequest"
		}
		var option = $.extend(defaults, options);
		var obj = option.obj;
		var comment_method = option.comment_method;
		var reply_method = option.reply_method;
		var praise_method = option.praise_method;
		commentBody=new Object();
		commentBody=obj;
		var callback = requestData(comment_method);
		console.log("commentCallback",callback);
		if(callback.status == "success"){
			floorNum = addComment($(this),callback.data,floorNum,userName,reply_method,praise_method);
		}else{
			alert(callback.msg);
		}
		return floorNum;
	}
	$.fn.getCommentBody=function(){
		return commentBody; 
	}
	
	//往数据库发送数据的方法
	function requestData(fn){
		try {
			return window[fn].call(this);
		} catch(error) {
			console.log("error",error);
		}
		var obj = new Object();
		obj.status="failed";
		obj.msg="没有找到该方法";
		return obj;
	}
	
	//点赞操作
	function pariseAction(el,praise_method){
		commentBody=new Object();
		if(el.find("i").hasClass("fa-thumbs-up")){
			commentBody.praise_flag = 1;
		}else{
			commentBody.praise_flag = 0;
		}
		var callback = requestData(praise_method);
		console.log("commentCallback",callback);
		if(callback.status == "success"){
			el.find("i").removeClass("fa-thumbs-o-up");
			el.find("i").addClass("fa-thumbs-up");
			el.find("i").css("color","red");
			var number = parseInt(el.find("span").text());
			el.find("span").text(++number+"人点赞");
		}else if(callback.status == "outnumber"){
			alert("不能重复点赞");
		}else{
			alert(callback.msg);
		}
	}
	
	//添加 回复内容
	function addReply(obj,parentEL){
		var replyStr = createReplyHtml(obj);
		if(parentEL.find(".commentbox").length > 0){
			parentEL.find(".commentbox").remove();
		}
		parentEL.find(".child-comment-list").append(replyStr);
	}
	
	//添加 评论
	function addComment(el,obj,floorNum,userName,reply_method,praise_method){
		var node = createCommentListBox(obj,floorNum);
		floorNum++;
		var nodeEL = $(node);
		nodeEL.find(".praise_comment").click(function(){
			pariseAction($(this),praise_method);
		});
		nodeEL.find(".reply_floor_host").click(function(){
			replyListen($(this),"parent",userName,reply_method);
		});
		nodeEL.find(".reply_floor_child").click(function(){
			replyListen($(this),"child",userName,reply_method);
		});
		el.append(nodeEL);
		return floorNum;
	}
	
	//添加 回复框
	function addReplybox(parentEL,obj,reply_method){
		if(replyName == ""){
			replyName = obj.replyUserName;
			textareaBoxListen(parentEL,obj,reply_method);
		}else if(replyName != obj.replyUserName){
			replyName = obj.replyUserName;
			if(parentEL.find(".commentbox").length > 0){
				parentEL.find(".commentbox>textarea").val("@"+obj.replyUserName+" ");
			}else{
				textareaBoxListen(parentEL,obj,reply_method);
			}
		}else{
			if(parentEL.find(".commentbox").length > 0){
				parentEL.find(".commentbox").remove();
			}else{
				textareaBoxListen(parentEL,obj,reply_method);
			}
		}
	}
	
	//回复体的 点击回复监听
	function replyListen(el,isParent,userName,reply_method){
		var newreplyName = el.parent().parent().find("a").first().text();
		var replyuid = el.attr("uid");
		var parentEL ="";
		if(isParent == "child"){
			parentEL = el.parent().parent().parent().parent();
		}else{
			parentEL = el.parent().parent();
		}
		var reply = CommentBody();
		reply.reply_user_id=replyuid;
		reply.userName=userName;
		reply.replyUserName=newreplyName;
		reply.create_time=getNowDateFormat();
		reply.parent_id=parentEL.attr("comment_id");
		console.log("reply",reply);
		addReplybox(parentEL,reply,reply_method);
	}
	
	//回复框的 发送按钮监听
	function textareaBoxListen(parentEL,obj,reply_method){
		var parent_id = parentEL.attr("comment_id");
		parentEL.find(".child-comment-list").append(createTextareaBox(obj));
		parentEL.find(".smile-reply").emoji({content_el:parentEL.find(".child-comment-list>.commentbox>textarea")});
		parentEL.find(".commentbox>.send-box>.btn-send").click(function(){
			var content = $(this).parent().prev().val();
			//移除前面的 @名字
			obj.content = content.replace(content.split(" ",1),"");
			try{
				commentBody=new Object();
				commentBody=obj;
				console.log("commentBody",obj);
				var callback = requestData(reply_method);
				console.log("commentCallback",callback);
				if(callback.status == "success"){
					addReply(callback.data,parentEL);
				}else{
					alert("error request");
				}
			}catch(error){
				console.log("error",error);
			}
		});
	}
	
	//创建 回复框
	function createTextareaBox(reply){
		var str = "<div class='commentbox'>";
		str = str+"<textarea cols='80' rows='50' placeholder='来说几句吧......' class='mytextarea' id='reply-content'>@"+reply.replyUserName+" </textarea>";
		str = str+"<div class='send-box'>";
		str = str+"<a href='javascript:void(0)' class='smile-reply'><i class='fa fa-smile-o'></i></a>";
		str = str+"<a href='javascript:void(0)' class='btn-send'>回复</a>";
		str = str+"</div></div>";
		return str;
	}
	
	
	//创建 评论内容
	function createCommentListBox(obj,floorNum){
		/*
		<div class="comment-list-box" comment_id="1">
			<header>
				<div class="author-head"><img src="./images/user1.png" /></div>
				<div class="author-info">
					<a href="javascript:void(0)">帅大叔</a>
					<div class="authore-info-footer">
						<span>1楼</span>
						<span>2017-12-20 09:55:10</span>
						<span><i class="fa fa-map-marker"></i>深圳市福田</span>
					</div>
				</div>
			</header>
			<p class="content">人生并不像火车要通过每个站似的经过每一个生活阶段。人生总是直向前行走，从不留下什么..............青春在走，时光在老，友谊在长久..............不知从什么时候，开始不爱说话，沉默代替了所有回答..............</p>
			<footer>
				<span><i class="fa fa-desktop"></i>Win8.1</span>
				<span><i class="fa fa-globe"></i>chrome 62.0.3202.94</span>
				<a href="javascript:void(0)" class="reply_floor_host" uid="1"><i class="fa fa-mail-reply"></i><span>回复</span></a>
				<a href="javascript:void(0)" class="praise_comment" ><i class="fa fa-thumbs-o-up"></i><span>66人点赞</span></a>
			</footer>
			<div class="child-comment-list">
				<div class="child-comment">
					<p><a href="javascript:void(0)">女神</a>:<a href="javascript:void(0)">@帅大叔</a>不是除了你，我就没人要了。只是除了你，我谁都不想要</p>
					<footer>
						<span>2017-12-20 12:00:00</span>
						<a href="javascript:void(0)" class="reply_floor_child" uid="2"><i class="fa fa-mail-reply"></i><span>回复</span></a>
					</footer>
				</div>
				
			<!-- 回复框 -->
			</div>
		</div>
		*/
		var content = replace_em(obj.content);
		var commentstr = "<div class='comment-list-box' comment_id='"+obj.comment_id+"'>";
			commentstr = commentstr + "<header>";
			commentstr = commentstr + "<div class='author-head'><img src='"+obj.userPath+"' /></div>";
			commentstr = commentstr + "<div class='author-info'>";
			commentstr = commentstr + "<a href='javascript:void(0)'>"+obj.userName+"</a>";
			commentstr = commentstr + "<div class='authore-info-footer'>";
			commentstr = commentstr + "<span>"+floorNum+"楼</span><span>"+obj.create_time+"</span>";
			if(obj.address != "" && typeof(obj.address) != "undefined"){
				commentstr = commentstr + "<span><i class='fa fa-map-marker'></i>"+obj.address+"</span>";
			}
			commentstr = commentstr + "</div></div></header>";
			commentstr = commentstr + "<p class='content'>"+content+"</p>";
			commentstr = commentstr + "<footer>";
			if(obj.os_name != "" && typeof(obj.os_name) != "undefined"){
				commentstr = commentstr + "<span><i class='fa fa-desktop'></i>"+obj.os_name+"</span>";
			}
			if(obj.browse_version != "" && typeof(obj.browse_version) != "undefined"){
				commentstr = commentstr + "<span><i class='fa fa-globe'></i>"+obj.browse_version+"</span>";
			}
			commentstr = commentstr + "<a href='javascript:void(0)' class='reply_floor_host' uid='"+obj.user_id+"'><i class='fa fa-mail-reply'></i><span>回复</span></a>";
			commentstr = commentstr + "<a href='javascript:void(0)' class='praise_comment'><i class='fa "+((obj.praise_flag == 1)?"fa-thumbs-up red":"fa-thumbs-o-up")+"'></i><span>"+obj.praise_num+"人点赞</span></a>";
			commentstr = commentstr + "</footer>";
			commentstr = commentstr + "<div class='child-comment-list'>";
			if(typeof(obj.replybody) != "undefined" && obj.replybody.length > 0){
				for(var i=0;i<obj.replybody.length;i++){
					var reply = obj.replybody[i];
					var replyELstr = createReplyHtml(reply);
					commentstr = commentstr + replyELstr;
				}
			}
			commentstr = commentstr + "</div></div>";
			return commentstr;
	}
	
	
	//创建 回复评论体
	function createReplyHtml(obj){
		var content = replace_em(obj.content);
		var replyStr = "<div class='child-comment'>";
			replyStr = replyStr+"<p><a href='javascript:void(0)'>"+obj.userName+"</a>:<a href='javascript:void(0)'>@"+obj.replyUserName+"</a>"+content+"</p>";
			replyStr = replyStr+"<footer>";
			replyStr = replyStr+"<span>"+obj.create_time+"</span>";
			replyStr = replyStr+"<a href='javascript:void(0)' class='reply_floor_child' uid='"+obj.user_id+"'><i class='fa fa-mail-reply'></i><span>回复</span></a>";
			replyStr = replyStr+"</footer></div>";
		return replyStr;
	}
	//评论的对象体
	function CommentBody(comment_id,parent_id,table_id,user_id,userName,userPath,content,reply_user_id,replyUserName,praise_num,address,browse_version,os_name,create_time){
		var obj = new Object();
		obj.comment_id=typeof(comment_id == "undefined")?"":comment_id;
		obj.parent_id=typeof(parent_id == "undefined")?"":parent_id;
		obj.table_id=typeof(table_id == "undefined")?"":table_id;
		obj.user_id=typeof(user_id == "undefined")?"":user_id;
		obj.userName=typeof(userName == "undefined")?"":userName;
		obj.userPath=typeof(userPath == "undefined")?"":userPath;
		obj.replyUserName=typeof(replyUserName == "undefined")?"":replyUserName;
		obj.content=typeof(content == "undefined")?"":content;
		obj.reply_user_id=typeof(reply_user_id == "undefined")?"":reply_user_id;
		obj.praise_num=typeof(praise_num == "undefined")?"":praise_num;
		obj.address=typeof(address == "undefined")?"":address;
		obj.browse_version=typeof(browse_version == "undefined")?"":browse_version;
		obj.os_name=typeof(os_name == "undefined")?"":os_name;
		obj.create_time=typeof(create_time == "undefined")?"":create_time;
		return obj;
	}
	
	//获取当前时间
	function getNowDateFormat(){
		var nowDate = new Date();
		var year = nowDate.getFullYear();
		var month = filterNum(nowDate.getMonth()+1);
		var day = filterNum(nowDate.getDate());
		var hours = filterNum(nowDate.getHours());
		var min = filterNum(nowDate.getMinutes());
		var seconds = filterNum(nowDate.getSeconds());
		return year+"-"+month+"-"+day+" "+hours+":"+min+":"+seconds;
	}
	function filterNum(num){
		if(num < 10){
			return "0"+num;
		}else{
			return num;
		}
	}
	
	//表情格式替换
	function replace_em(str){
		//转义
		str = $('<span/>').text(str).html();
		str = str.replace(/\</g,'&lt;');
		str = str.replace(/\>/g,'&gt;');
		str = str.replace(/\n/g,'<br/>');
		str = str.replace(/\[qq_([0-9]*)\]/g,"<img src='./face/emoji1/$1.gif' />");
		str = str.replace(/\[em_([0-9]*)\]/g,"<img src='./face/emoji2/$1.png'  />");
		str = str.replace(/\[other_([0-9]*)\]/g,"<img src='./face/emoji3/$1.jpg' />");
		return str;
	
	}
	
})(jQuery);