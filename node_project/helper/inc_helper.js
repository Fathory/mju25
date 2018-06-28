var  Common = function(){
    var url = require("url");
    var fs = require("fs");
// private
    /**
    * 변수 값이 비어 있는지 확인해줌
    * @param  {var} vars js에서 사용되는 모든 변수
    * @return {boolean}      비어있다 true, 변수값이 있다 false
    */
    var empty = function (vars) {
      if (typeof(vars) == "undefined") return true;
      if (typeof(vars) == "null") return true;
      if (vars == null) return true;
      if (typeof(vars) == "string" && vars == "") return true;
      if (typeof(vars) == "object" && Object.keys(vars).length==0) return true;
      return false;
    }

    /**
    * 현재 시간을 반환함
    * @return YYYY-MM-DD HH24:MI:SS
    */
    var now  = function (opt){
        var date = new Date();
        if (opt && opt == "mic") {
            return date.toFormat('YYYY-MM-DD HH24:MI:SS') + "." + date.getMilliseconds();
        } else {
            return date.toFormat('YYYY-MM-DD HH24:MI:SS');
        }
    }

    /**
    * 세션 값 확인
    * @param  {request}
    * @return {[boolean]}     true : 세션 존재, false : 세션없음
    */
     var sessionCheck = function (req) {
      sess = req.session;
      if (empty(sess)){
        return false;
      }
      if (empty(sess.user_id)){
        return false;
      }else {
        return true;
      }
    }

    /**
     * JSON 검색, 페이징 기능
     * @param  {JSON} data
     * @param  {Object} query        검색쿼리
     * @return {JSON}  {rows:,total:1}
     */
    var searchRuleFileJSON = function (data, query) {
      var offset = 0,
          limit = 15,
          rows = [],
          total = data.length;

      //search
      var allow_field = [
        // 'create_time',
        // 'modified_time',
        'action',
        'c_code',
        'criticalTime_min',
        'criticalTime_max',
        'criticalValue_min',
        'criticalValue_max',
        'raw',
        'rule',
        'rule_id', //LIKE regex
        'rule_type',
        's_code',
        's_code_in', // OR
        'severity',
        'rule_detail'
      ];
      // 검색 쿼리에 맞게 검색 필드를 먼저 정의한다
      var search_field = {};
      var search_start = false;
      for (field of allow_field) {
        if (typeof(query[field])!="undefined"){
          search_field[field] = query[field];
          search_start = true;
        }
      }
      // 검색 쿼리가 존재하면 검색을 우선하여 데이터를 선별한다
      if (search_start == true) {
        var sdata = [];
        for (var i=0; i<total; i++) { // Full index searching
          let founded = true;
          for (key in search_field) {
            if (key == 'rule_id'){ // regex
              if (data[i][key].indexOf(search_field[key])<0){
                founded = false; // 저장 하지 않는다
                continue;
              }
            } else if (key == 's_code_in') {
                var s_code_in = search_field['s_code_in'].split(",");
                if (s_code_in.indexOf(data[i].s_code.toString()) < 0){
                    founded = false;
                    continue;
                }
            } else if (key == 'criticalTime_min') {
              if (Number(data[i].criticalTime) < Number(search_field[key])) {
                founded = false; // 최소값 큰 경우는 제외
                continue;
              }
            } else if (key == 'criticalValue_min') {
              if (Number(data[i].criticalValue) < Number(search_field[key])) {
                founded = false; // 최소값 큰 경우는 제외
                continue;
              }
            } else if (key == 'criticalTime_max'){
              if (Number(data[i].criticalTime) > Number(search_field[key])) {
                founded = false; // 최대값 작은 경우 제외
                continue;
              }
            } else if (key == 'criticalValue_max'){
              if (Number(data[i].criticalValue) > Number(search_field[key])) {
                founded = false; // 최대값 작은 경우 제외
                continue;
              }
            } else {
              if (data[i][key] != search_field[key]){
                founded = false; // 저장 하지 않는다
                continue;
              }
            }// .. if (field type)
          } // .. for (search_field)
          if (founded == true) {
            sdata.push(data[i]);
          }
        } // .. for (full index)

        // 검색 결과로 변경함
        data = sdata;
        total = data.length;
      } // .. if (search_start)

      // page
      if (!empty(query['offset'])){
        offset = parseInt(query['offset']);
      }
      if (!empty(query['limit'])){
        limit = parseInt(query['limit']);
        limit = limit + offset;
        limit = (limit > total)?total:limit; // 최대 값을 초과할수 없다
      }

      // set rows
      for (var i = offset; i < limit; i++) {
        rows.push(data[i]);
      }
      return {"rows":rows,"total":total};
    }

    var getRemoteAddr = function(req) {
      var ipv6 = req.headers['x-forwarded-for'] || req.connection.remoteAddress; //IPv6 type
      //to IPv4 type
      let ipv4 = ipv6.split("::ffff:"); // ipv4-mapped
      if (ipv4.length>0) {
        var ip = ipv4.join("");
      } else {
        ip = ipv6;
      }
      return ip;
    }

    var auditLog = function (req, type, text) {
      var audit = require( __dirname.split("helper").join("") + 'models/audit_model.js');
      var ip = getRemoteAddr(req);
      var sess = req.session;
      var user = ((typeof(sess)=="undefined")|| typeof(sess.user_id)=="undefined")?'SniperRDS':sess.user_id;
      audit.log(type,text,user,ip);
    }

    /**
     * 설정 수정시간 변경
     * - 해당 수정시간으로 하위 릴레이에서 설정 시간을 동기화 한다
     */
    var setConfigTime = function(time) {
      if (empty(time)){
        time = now();
      }
      //fs inc_helper 로드에 기본 라이브러리임
      fs.writeFile('data/current.time', time, function(err){
        console.log(err);
      });
    }
    /**
     * 설정 변경 수정 시간 가져오기
     * @return {date time} YYYY-MM-DD HH:II:SS
     */
    var getConfigTime = function() {
      var time = fs.readFileSync('data/current.time','utf-8');
      return time;
    }

    /**
     * [GET]메서드 값을 헤더에서 추출하여 반환해 준다
     * @param  {request} req 요청값
     * @return {object}     GET 파라미터 값
     */
    var get = function(req) {
      // get query
      var url_parts = url.parse(req.url, true);
      return url_parts.query;
    }

    /**
     * [POST] 메서드 값을 바디에서 추출하여 반환
     * @param  {request} req 요청값
     * @return {object}     [POST]파라미터 값
     */
    var post = function(req) {
      return req.body;
    }

    var base64 = {
        'encode' : function (str){
            return Buffer.from(str, 'utf8').toString('base64');
        },
        'decode' : function (bs64){
            return Buffer.from(bs64, 'base64').toString('utf8');
        }
    }

    // multipart 검증
    var multipartCheck = function (req) {
        if (req.headers['content-type']) {
            var headertypes = req.headers['content-type'].split(";");
            if (headertypes.indexOf('multipart/form-data') > -1) {
                return true;
            }
        }
        return false;
    }

    function MultiPart_parse(body, contentType) {
        // Examples for content types://      multipart/form-data; boundary="----7dd322351017c"; ...
        //      multipart/form-data; boundary=----7dd322351017c; ...
        var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

        if (!m) {
            throw new Error('Bad content-type header, no multipart boundary');
        }

        let s, fieldName;
        let boundary = m[1] || m[2];

        function Header_parse(header) {
            var headerFields = {};
            var matchResult = header.match(/^.*name="([^"]*)"$/);
            if (matchResult) headerFields.name = matchResult[1];
            return headerFields;
        }

        function rawStringToBuffer(str) {
            var idx, len = str.length,
                arr = new Array(len);
            for (idx = 0; idx < len; ++idx) {
                arr[idx] = str.charCodeAt(idx) & 0xFF;
            }
            return new Uint8Array(arr).buffer;
        }

        // \r\n is part of the boundary.
        boundary = '\r\n--' + boundary;

        var isRaw = typeof(body) !== 'string';

        if (isRaw) {
            var view = new Uint8Array(body);
            s = String.fromCharCode.apply(null, view);
        } else {
            s = body;
        }

        // Prepend what has been stripped by the body parsing mechanism.
        s = '\r\n' + s;

        var parts = s.split(new RegExp(boundary)),
            partsByName = {};

        // First part is a preamble, last part is closing '--'
        for (var i = 1; i < parts.length - 1; i++) {
            var subparts = parts[i].split('\r\n\r\n');
            var headers = subparts[0].split('\r\n');
            for (var j = 1; j < headers.length; j++) {
                var headerFields = Header_parse(headers[j]);
                if (headerFields.name) {
                    fieldName = headerFields.name;
                }
            }

            partsByName[fieldName] = isRaw ? rawStringToBuffer(subparts[1]) : subparts[1];
        }

        return partsByName;
    }

    function Boundary_parse(body) {
        var bndry = body.split('Content-Disposition: form-data;')[0];
        return bndry.trim().slice(2);
    }
    /**
     * Multipart 폼으로 전달된 파일을 업로드한다
     * @param  {[type]}   req      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    var multipartUpload = function (req, callback) {
        var rawBody = req.rawBody;
        var fields = MultiPart_parse(rawBody,req.headers['content-type'])
        var filename = Object.keys(fields);
        callback(filename[0], fields[filename[0]]);
    }

// public
    return {
        empty : empty,
        now : now,
        sessionCheck : sessionCheck,
        searchRuleFileJSON : searchRuleFileJSON,
        getRemoteAddr : getRemoteAddr,
        auditLog : auditLog,
        setConfigTime : setConfigTime,
        getConfigTime : getConfigTime,
        get : get,
        post : post,
        base64 :base64,
        multipartCheck: multipartCheck,
        multipartUpload : multipartUpload,
    }
}

module.exports =  Common ();
