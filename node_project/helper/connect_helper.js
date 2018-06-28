/**
 * Engine
 */
var req = require('request');
var fs = require('fs');
const inc = require("../helper/inc_helper.js");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // SSL 인증서 오류 우회

var webConf = JSON.parse(fs.readFileSync('./conf/config.json','binary'));
const BASE_DIR = webConf.BASE_DIR;

const EngineConnector = function() {
    'use strict'
    var __engine_host = '127.0.0.1';
    var __engine_port = '5440';
    var __differ_port = '5441';
    var __renew_port = '5442';
    var __detect_port = '5443';

    var connect = function(method, urls, callback) {
        // console.log('EngineConnector > ['+method+'] ' , urls);
        switch (method) {
            case 'get':
                req.get(urls, callback);
                break;
            case 'post':
                req.post(urls, callback);
                break;
            case 'put':
                req.put(urls, callback);
                break;
            case 'delete':
                req.delete(urls, callback);
                break;
            default:
                req.get(urls, callback);
        };
    }
    var connectEngine = function(method, path, callback) {
        var urls = 'http://' + __engine_host + ':' + __engine_port;
        method = method.toLowerCase();
        urls += (path.substr(0, 1) == '/') ? path : '/' + path;
        connect(method, urls, callback);
    };

    var connectDiffer = function(method, path, callback) {
        var urls = 'http://' + __engine_host + ':' + __differ_port;
        method = method.toLowerCase();
        urls += (path.substr(0, 1) == '/') ? path : '/' + path;
        connect(method, urls, callback);
    };

    var connectRenew = function(method, path, callback) {
        var urls = 'http://' + __engine_host + ':' + __renew_port;
        method = method.toLowerCase();
        urls += (path.substr(0, 1) == '/') ? path : '/' + path;
        connect(method, urls, callback);
    }

    var connectDetect = function(method, path, callback) {
        var urls = 'http://' + __engine_host + ':' + __detect_port;
        method = method.toLowerCase();
        urls += (path.substr(0, 1) == '/') ? path : '/' + path;
        connect(method, urls, callback);
    }

    var getteringPath = function(path) {
        return (path.substr(-1, 1) == "/") ? path : path + '/';
    };

    var logParser = function(text) {
        var spos = text.indexOf("##################");
        spos = spos + 18;
        var epos = text.indexOf("######################", spos);
        if (epos > 0) {
            var log = text.substring(spos, epos);
            log = "\n" + log.split("]").join("]\n");
        } else {
            var log = text;
        }

        return log
    };

    var exec = require('child_process').exec; // 파일 제거

    /**
     * 룰 유효성 검증 엔진 통신
     * @param  {[type]} engine  [snort , yara]
     * @param  {[type]} type    [0: rule , 1: file]
     * @param  {[type]} request [rule , or rule file name]
     */
    var ruleChecker = function(engine, type, request, callback) {
        var os = require('os');
        if (os.platform() == 'win32') {
            callback({
                "error_cnt": 0,
                "nonerror_cnt": 1,
                "error_log": "Server is Windows"
            });
            return false;
        }
        var isFile = (type == 1)?true:false;
        if (engine == 'yara') {
            // Yara
            var yara_test_rule_file_name = BASE_DIR + "/manager/htdocs/tmp/system/yara_check_1.yara";
            var check_cmd = BASE_DIR + "/core/core/yara_check/Cyara 2 ";
            if (type == 0) { // rule
                check_cmd += '"' + yara_test_rule_file_name + '"'; // 0은 1개의 룰 1은 파일이다
                fs.writeFileSync(yara_test_rule_file_name, request);
            } else if (type == 1) { // file
                check_cmd += '"' + request + '"'; // 0은 1개의 룰 1은 파일이다
            }
        } else {
            // Snort
            var check_cmd = BASE_DIR + "/core/core/snort_check/Snort_check 1  "+ BASE_DIR + "/core/core/snort_check/config/snort.conf ";
            if (type == 0) { // rule
                check_cmd += '"' + request + '" 0'; // 0은 1개의 룰 1은 파일이다
            } else if (type == 1) { // file
                check_cmd += '"' + request + '" 1'; // 0은 1개의 룰 1은 파일이다
            }
        }

        exec(check_cmd, function(err, stdout, stderr) {
            if (engine == 'yara' && !isFile) {
                fs.unlinkSync(yara_test_rule_file_name);
            }
            if (!err && !stderr) {
                var spos = stdout.indexOf("====");
                spos = spos + 4;
                var epos = stdout.indexOf("====", spos);
                var result = stdout.substr(spos, epos - spos); // 결과값 -> totcnt:0 nonerror_cnt:0 error_cnt:1
                var log = stdout.substr(0, spos - 4);
                var json = result.split(" ").join(",")
                json = eval("({" + json + "})");
                log = logParser(log);
                callback({
                    "error_cnt": json.error_cnt,
                    "nonerror_cnt": json.nonerror_cnt,
                    "error_log": log
                });
            } else if (stderr) {
                stderr = stderr.split(yara_test_rule_file_name).join("");
                callback({
                    "error_cnt": 1,
                    "nonerror_cnt": 0,
                    "error_log": stderr
                });
            } else {
                callback({
                    "error_cnt": 1,
                    "nonerror_cnt": 0,
                    "error_log": err
                });
            }
        });
    };

    var createRuleFile = function(type, path, file, callback) {
        var types = 'ncsc_' + type;
        var urls = 'renew?b_path='+path+'&b_name='+file+'&type=' + types + '&pass=' +inc.base64.encode('sniper123');
        console.log("renew > ",urls);
        connectRenew('post', urls,
            function(err, response, body) {
                callback(err, body);
            });
    };
    var resolveEncryptRuleFile = function(rule_path, rule_file, password, response_path, response_file) {
        var rpath = (typeof(response_path) == "undefined") ? rule_path : response_path;
        var rname = (typeof(response_file) == "undefined") ? rule_file + ".en" : response_file;
        password = (!inc.empty(password)) ? inc.base64.encode(password) : '';
        rule_path = getteringPath(rule_path);
        rpath = getteringPath(rpath);
        var urls = '/rule?type=1&path=' + rule_path + '&name=' + rule_file + '&pass=' + password + '&rpath=' + rpath + '&rname=' + rname;
        console.log('encode>', urls);
        return new Promise(resolve => {
            connectEngine('post', urls,
                function(err, res) {
                    if (err) {
                        console.log(err); //  기존 요청한 파일 경로와 파일명으로 전달
                        resolve(false);
                        return;
                    }
                    resolve(res.body); // Async
                });
        });
    }
    var resolveDecryptRuleFile = function(rule_path, rule_file, password, response_path, response_file) {
        var rpath = (typeof(response_path) == "undefined") ? rule_path : response_path;
        var rname = (typeof(response_file) == "undefined") ? rule_file.split(".en").join("") : response_file;
        rule_path = getteringPath(rule_path);
        rpath = getteringPath(rpath);
        password = (!inc.empty(password)) ? inc.base64.encode(password) : '';
        var urls = '/rule?type=2&path=' + rule_path + '&name=' + rule_file + '&pass=' + password + '&rpath=' + rpath + '&rname=' + rname;
        console.log('decode >', urls);
        return new Promise(resolve => {
            connectEngine('post', urls,
                function(err, res) {
                    if (err) {
                        console.log(err);
                        resolve(false);
                        return;
                    }
                    resolve(res.body); // Async
                });
        });
    };

    /**
     * 탐지이력 전송
     */
    var sendDetectEvent = function(type, path, file, callback) {
        var types = 'ncsc_' + type;
        var urls = 'detect?path='+path+'&name='+file+'&type=' + types;
        console.log("detect > ",urls);
        connectDetect('post', urls,
            function(err, response, body) {
                callback(err, body);
            });
    }

    return {
        /**
         * 파일 암호화 요청
         * @param  {[type]} rule_path     원본경로
         * @param  {[type]} rule_file     원본파일명
         * @param  {[type]} password      암호화 하려는 비밀번호
         * @param  {[type]} response_path 대상경로
         * @param  {[type]} response_file 대상파일명
         * @return {Promise}              resove
         */
        resolveEncryptRuleFile: resolveEncryptRuleFile,

        /**
         * 복호화
         * @param  {[type]} rule_path     원본경로
         * @param  {[type]} rule_file     원본파일명
         * @param  {[type]} password      암호화 했던 비밀번호
         * @param  {[type]} response_path 대상경로
         * @param  {[type]} response_file 대상파일명
         * @return {Promise}              resove
         */
        resolveDecryptRuleFile: resolveDecryptRuleFile,

        diffRuleFile: function(requester, callback) {
            var param = '';
            param += 'type=' + requester.type;
            param += '&b_path=' + requester.b_path;
            param += '&b_name=' + requester.b_name;
            param += '&a_path=' + requester.a_path;
            param += '&a_name=' + requester.a_name;
            param += '&response_path=' + requester.response_path;
            param += '&response_file=' + requester.response_file;
            param += '&pass=' + inc.base64.encode(requester.pass);

            connectDiffer('post', '/diff?' + param, function(err, response, body) {
                callback(err, body);
            });
        },

        /**
         * 스노트 룰의 정상 유무를 확인 할 수 있다
         * @param  {string}   rule     룰정보를 입력한다
         * @param  {Function} callback
         */
        checkSnortRule: function(rule, callback) {
            rule = rule.split('"').join('\\"');
            ruleChecker('snort', 0, rule, callback);
        },

        /**
         * 스노트 룰 파일 정상 유무를 확인한다
         * @param  {string}   file     JSON 형식의 룰 파일 경로
         * @param  {Function} callback
         */
        checkSnortRuleFile: function(file, callback) {
            ruleChecker('snort', 1, file, callback);
        },

        checkYaraRule: function(rule, callback) {
            ruleChecker('yara', 0, rule, callback);
        },

        checkYaraRuleFile: function(file, callback) {
            ruleChecker('yara', 1, file, callback);
        },

        /**
         * 업데이트 서버의 스노트 룰 파일을 생성 할 수 있도록 엔진에 요청한다
         * @param  {[type]}   path     [경로]
         * @param  {[type]}   file     [룰파일명]
         * @param  {Function} callback []
         */
        createSnortRuleFile: function(path, file, callback) {
            createRuleFile('snort', path, file, callback);
        },
        /**
         * 업데이트 서버의 야라 룰 파일을 생성 할 수 있도록 엔진에 요청한다
         * @param  {[type]}   path     [경로]
         * @param  {[type]}   file     [룰파일명]
         * @param  {Function} callback []
         */
        createYaraRuleFile: function(path, file, callback) {
            createRuleFile('yara', path, file, callback);
        },

        /**
         * 탐지이력 전송
         * @param  {[type]}   type     [description]
         * @param  {[type]}   path     [description]
         * @param  {[type]}   file     [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        sendDetectEvent : sendDetectEvent,
    };
};

module.exports = EngineConnector();
