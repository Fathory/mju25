exports.db_module = function(db, boolEncrypt) {
  var SQL_QUERY = '';
  var FROM_TABLE = '';
  var WHERE_QUERY = '';
  var GROUP_QUERY = '';
  var ORDER_QUERY = '';
  var LIMIT_QUERY = '';
  var OFFSET = 0;
  var PARAM_ARR = new Array();
  var ISTOTAL = true;
  var JOIN_QUERY = '';
  var ENC_OPTION = (typeof(boolEncrypt) == "boolean") ? boolEncrypt : false;

  // 초기화
  var init = function() {
    SQL_QUERY = '';
    FROM_TABLE = '';
    WHERE_QUERY = '';
    GROUP_QUERY = '';
    ORDER_QUERY = '';
    LIMIT_QUERY = '';
    OFFSET = 0;
    PARAM_ARR = new Array();
    ISTOTAL = true;
    JOIN_QUERY = '';
  }
  // 자동으로 이스캐이프 처리를 함
  var autoEscape = function(column, opt) {
    if (opt == false) {
      return column;
    }
    column = column.trim();
    column = column.split("`").join("");
    var cl = column.split(".");
    if (cl.length > 1) {
      return '`' + cl[0] + '`.`' + cl[1] + '`';
    } else {
      return '`' + column + '`';
    }
  };

  /**
   * 쿼리문 ? 에 배열 값을 순차적으로 삽입하여 쿼리를 생성함
   * @param  {String} str
   * @param  {Object} arr
   * @return {String} 완전한 문자열 생성
   */
  var setFilter = function(str, arr) {
    for (v of arr) {
      var n = str.indexOf("?");
      str = str.substr(0, n) + "'" + v + "'" + str.substr(n + 1, str.length);
    }
    return str;
  }

  var normal_query = function(sql, callback) {
    db.serialize(function() {
      db.all(sql, function(err, row) {
        console.log('query > ' + sql);
        callback(row, 0, err);
      });
    });
  };

  var normal_get = function(count_query, rs_query, callback) {
    // 순서 대로 쿼리
    db.serialize(function() {
      // 1. total 값 요청이 있는경우 기본은 total 값을 반환
      if (ISTOTAL == true) {
        //total count
        var total = 0;
        console.log("c_query >", count_query);
        var q = db.get(count_query, ...PARAM_ARR, function(err, row) {
          if (err) {
            console.log('[db_helper] ', err, count_query);
            // callback({
            //   'total': 0
            // }, 0, err);
            return;
          } //에러 처리
          total = row.total;
        });
      } else {
        var total = 0;
      }

      // 2. run reql query
      var log_param_arr = PARAM_ARR;
      db.all(rs_query, ...PARAM_ARR, function(err, row) {
        init(); // 초기화

        if (err) {
          console.log('[db_helper] ', err, rs_query);
          callback({
            'total': 0
          }, 0, err);
          return;
        } //에러 처리

        console.log('query >', rs_query, log_param_arr);
        callback(row, total, err); // callback
      });
    });
  }

  var normal_insert = function(table, inserts, callback) {
    if (typeof(inserts) !== "object") {
      callback(false);
      return false;
    }
    let item = new Array();
    let col = '';
    let val = '';
    for (key in inserts) {
      col += ',`' + key + '`';
      val += ',?';
      item.push(inserts[key]);
    }
    col = col.substr(1, col.length); // left trim
    val = val.substr(1, val.length); // left trim
    let insert_query = "INSERT INTO `" + table + "` (" + col + ") VALUES (" + val + ")";
    let stmt = db.prepare(insert_query);
    var rs = stmt.run(...item, function() {
      callback(this);
    });
    init();
    stmt.finalize();
  };

  var normal_update = function(table, updates, callback) {
    if (typeof(updates) !== "object") {
      callback(false);
      return false;
    }
    let col = '';
    let param = new Array();
    for (key in updates) {
      col += ',`' + key + '`=?';
      param.push(updates[key])
    }
    col = col.substr(1, col.length); // left trim

    let update_query = "UPDATE `" + table + "` set " + col;
    if (WHERE_QUERY !== '') {
      update_query += WHERE_QUERY;
      for (let i = 0; i < PARAM_ARR.length; i++) {
        param.push(PARAM_ARR[i]);
      }
    }
    console.log('query >' + update_query, param);
    let stmt = db.prepare(update_query);
    var rs = stmt.run(...param, function() {
      callback(this);
    });
    init();
    stmt.finalize();
  };

  var normal_delete = function(delete_query, param, callback) {
    let stmt = db.prepare(delete_query);
    var rs = stmt.run(...param, function() {
      callback(this);
    });
    init();
    stmt.finalize();
  };

  var enc_query = function(sql, callback) {
    console.log('query> ', sql);
    var data = db.run(sql);
    callback(data, 0, null);
    init();
  };

  var enc_get = function(count_query, rs_query, callback) {
    var total = 0;
    if (ISTOTAL == true) {
      count_query = setFilter(count_query, PARAM_ARR);
      var counts = db.run(count_query);
      if (counts.length > 0) {
        total = counts[0].total;
      }
    }
    rs_query = setFilter(rs_query, PARAM_ARR);
    console.log('query> ', rs_query);
    var rows = db.run(rs_query);
    callback(rows, total, null);
    init();
  };

  var enc_insert = function(table, inserts, callback) {
    var new_insert = new Array();
    for (key in inserts) {
      new_insert[key] = inserts[key];
    }
    db.insert(table, new_insert, function(lastId) {
      console.log(lastId);
      callback({
        'sql': '',
        'lastID': lastId,
        'changes': 1
      });
    });
    init();
  };

  var enc_insert_batch = function (table, inserts, callback) {
    if (inserts && inserts.length > 0) {
        var insert_query = '';
        var key = Object.keys(inserts[0]);
        var column = '';
        var quote = false;
        for (k of key) {
            column += ',`'+k+'`';
        }
        column = column.substr(1); //left trim;

        var insert_query = "INSERT INTO `"+table+"` ("+column+") VALUES ";
        var values_query = "";
        var i = 0;
        for (ins of inserts) {
            values_query = ""; //초기화
            if (i > 500) {
                db.run(insert_query);
                insert_query = "INSERT INTO `"+table+"` ("+column+") VALUES ";
                quote = false;
                i = 0;
            }
            for (k of key) {
                values_query += ",'"+ins[k]+"'";
            }
            values_query = values_query.substr(1);
            values_query = "("+values_query+")";
            // batch add
            if (quote == false) {
                insert_query = insert_query + values_query;
                quote = true;
            } else {
                insert_query = insert_query + "," +values_query;
            }
            i++;
        }
        // last query run
        db.run(insert_query);
        callback({
            'sql': '',
            'lastID': '0',
            'changes': 1
        });
        init();
    } else {
        callback({"sql":'',"lastID":'',"changes":0});
    }
  }

  var enc_update = function(table, updates, callback) {
    var where = '';
    var set = '';
    if (WHERE_QUERY !== '') {
      for (key in updates) {
        set += "," + autoEscape(key, true) + "= '" + updates[key] + "'";
      }
      set = set.substr(1, set.length);
      where = setFilter(WHERE_QUERY, PARAM_ARR);
    }
    update_query = "UPDATE `" + table + "` set " + set + where;
    var rows_id = db.run(update_query); // undefined last id....
    callback({
      'sql': update_query,
      'lastID': rows_id,
      'changes': 1
    });
    init();
  };

  var enc_delete = function(delete_query, param, callback) {
    delete_query = setFilter(delete_query, PARAM_ARR);
    var rows_id = db.run(delete_query);
    callback(rows_id);
    init();
  };

  // public
  return {
    query: function(sql, callback) {
      if (ENC_OPTION == true) {
        enc_query(sql, callback);
      } else {
        normal_query(sql, callback);
      }
    },
    get: function(callback) {
      if (SQL_QUERY == '') return false;
      var rs_query = SQL_QUERY;
      var count_query = 'SELECT Count(*) as total FROM `' + FROM_TABLE + '` ';
      if (JOIN_QUERY !== '') {
        rs_query += JOIN_QUERY;
        count_query += JOIN_QUERY;
      }
      if (WHERE_QUERY !== '') {
        rs_query += WHERE_QUERY;
        count_query += WHERE_QUERY;
      }
      if (GROUP_QUERY !== '') {
        rs_query += GROUP_QUERY;
      }
      if (ORDER_QUERY !== '') {
        rs_query += ORDER_QUERY;
      }
      // limit
      if (LIMIT_QUERY !== '') {
        rs_query += LIMIT_QUERY;
      }

      if (ENC_OPTION == true) {
        // 암호
        enc_get(count_query, rs_query, callback);
      } else {
        // 일반
        normal_get(count_query, rs_query, callback);
      }
    },
    select: function(column, quote) {
      init(); // 초기화
      SQL_QUERY = 'SELECT ';
      var tyeps = typeof(column);
      if (quote == false) SELECT_QUOTE = false;
      switch (typeof(column)) {
        case "undefined":
          SQL_QUERY += "*";
          break;
        case "object":
          SQL_QUERY += "*";
          var len = column.length;
          if (len > 0) {
            for (var i = 0; i < len; i++) {
              SQL_QUERY += autoEscape(column[i], quote);
            }
          } else {
            SQL_QUERY += "*";
          }
          break;
        case "string":
          column = column.split(",");
          var len = column.length;
          if (len > 0) {
            let column_tmp_string = '';
            for (var i = 0; i < len; i++) {
              column_tmp_string += "," + autoEscape(column[i], quote);
            }
            column_tmp_string = column_tmp_string.substr(1, column_tmp_string.length);
            SQL_QUERY += column_tmp_string;
          } else {
            SQL_QUERY += "*";
          }
          break;
        default:
          SQL_QUERY += "*";
      }
    },
    from: function(table) {
      FROM_TABLE = table;
      SQL_QUERY += " FROM `" + table + "`";
    },
    where: function(column, val, quote) {
      WHERE_QUERY = (WHERE_QUERY == '') ? " WHERE " : WHERE_QUERY + " AND ";
      var oper = /(\<\=|\>\=|\=|\<\>|\<|\>)/.exec(column);
      if (oper == null) {
        oper = ["", "="];
      }
      column = column.split(oper[1]).join("").trim();
      WHERE_QUERY += autoEscape(column, quote) + " " + oper[1] + " ?";
      PARAM_ARR.push(val);
    },
    where_in: function(column, arr, quote, pre) {
      if (typeof(arr) !== "object") {
        console.log('[db_helper]- where_in Parameter type of value in error');
        return false;
      }
      if (typeof(pre) == "undefined" || pre == null) {
        pre = "";
      }
      WHERE_QUERY = (WHERE_QUERY == '') ? " WHERE " : WHERE_QUERY + " AND ";
      var inval = '';
      for (val of arr) {
        inval += ",?";
        PARAM_ARR.push(val);
      }
      inval = inval.substr(1, inval.length);
      WHERE_QUERY += autoEscape(column, quote) + pre + " IN(" + inval + ")";
    },
    where_like: function(column, val, quote, pre) {
      if (typeof(pre) == "undefined" || pre == null) {
        pre = "";
      }
      WHERE_QUERY = (WHERE_QUERY == '') ? " WHERE " : WHERE_QUERY + " AND ";
      WHERE_QUERY += autoEscape(column, quote) + pre + " LIKE ? ";
      PARAM_ARR.push(val);
    },
    /* new api */
    where_or: function(column, val, quote) {
      WHERE_QUERY = (WHERE_QUERY == '') ? " WHERE " : WHERE_QUERY + " OR ";
      var oper = /(\<\=|\>\=|\=|\<\>|\<|\>)/.exec(column);
      if (oper == null) {
        oper = ["", "="];
      }
      column = column.split(oper[1]).join("").trim();
      WHERE_QUERY += autoEscape(column, quote) + " " + oper[1] + " ?";
      PARAM_ARR.push(val);
    },
    where_not_in: function(column, arr, quote) {
      this.where_in(column, arr, quote, ' NOT');
    },
    where_not_like: function(column, val, quote) {
      this.where_like(column, arr, quote, ' NOT');
    },
    where_query: function(query) {
      WHERE_QUERY += query;
    },
    limit: function(cnt) {
      LIMIT_QUERY = " LIMIT " + OFFSET + "," + cnt;
    },
    offset: function(start) {
      OFFSET = start;
    },
    order_by: function(sort, order) {
      if (typeof(sort) == "undefined") {
        return true;
      }
      if (typeof(order) == "undefined") {
        order = "asc"
      }
      order = order.toUpperCase();
      if (order !== "ASC" && order !== "DESC") {
        order = "ASC"
      }
      ORDER_QUERY = " ORDER BY `" + sort + "` " + order;
    },

    group_by: function(group, option) {
      if (typeof(group) == "undefined") {
        return true;
      }
      var group_tag = '';
      if (option == false) {
        group_tag = group;
      } else {
        var groups = group.split(",");
        for (var i = 0; i < groups.length; i++) {
          group_tag += ",`" + groups[i] + "`";
        }
        group_tag = group_tag.substr(1, group_tag.length); // left trim
      }
      GROUP_QUERY = " GROUP BY " + group_tag;
    },
    insert: function(table, inserts, callback) {
      if (ENC_OPTION == true) {
        enc_insert(table, inserts, callback);
      } else {
        normal_insert(table, inserts, callback);
      }
    },
    insert_batch: function(table, inserts, callback) {
      if (ENC_OPTION == true) {
        enc_insert_batch(table, inserts, callback);
      } else {
        if (typeof(inserts) !== "object") {
          callback(false);
          return false;
        }
        let columns = new Array();
        let col = '';
        let val = '';
        for (key in inserts[0]) {
          columns.push(key);
          col += ',`' + key + '`';
          val += ',?';
        }
        col = col.substr(1, col.length); // left trim
        val = val.substr(1, val.length); // left trim
        let insert_query = "INSERT INTO `" + table + "` (" + col + ") VALUES (" + val + ")";
        let stmt = db.prepare(insert_query);
        for (let i = 0; i < inserts.length; i++) {
          let row = [];
          for (let z = 0; z < columns.length; z++) {
            row.push(inserts[i][columns[z]]);
          }
          var rs = stmt.run(...row);
        }
        init();
        stmt.finalize(callback(rs));
      }
    },
    update: function(table, updates, callback) {
      if (ENC_OPTION == true) {
        enc_update(table, updates, callback);
      } else {
        normal_update(table, updates, callback);
      }
    },
    delete: function(table, callback) {
      let param = new Array();
      let delete_query = "DELETE FROM `" + table + "`";
      if (WHERE_QUERY !== '') {
        delete_query += WHERE_QUERY;
        for (let i = 0; i < PARAM_ARR.length; i++) {
          param.push(PARAM_ARR[i]);
        }
      }
      if (ENC_OPTION == true) {
        enc_delete(delete_query, param, callback);
      } else {
        normal_delete(delete_query, param, callback);
      }
    },
    // 토탈 값을 필요로 하는경우  true  아닌경우 false
    setIsTotal: function(bool) {
      if (typeof(bool) !== "undefined" && typeof(bool) == "boolean") {
        ISTOTAL = (bool == true) ? true : false;
      }
    },

    /**
     * 테이블 조인
     * @param  {string} table2  조인할 테이블명
     * @param  {string} on      조인할 조건
     * @param  {string} options Options are: left, right, outer, inner, left outer, and right outer.
     * @return {[void]}         error : false;
     */
    join: function(table2, on, options) {
      // 오류 예외
      if (typeof(table2) == 'undefined' ||
        typeof(on) == 'undefined' ||
        on == ''
      ) {
        return false;
      }
      if (typeof(options) !== 'undefined') {
        options = options.toUpperCase(options); // 대문자로 변경
        var patt = /^(LEFT|RIGHT|INNER|OUTER|LEFT\sOUTER|RIGHT\sOUTER)$/g
        var leg = patt.exec(options);
        if (leg !== null && leg.length > 0) {
          JOIN_QUERY += ' ' + options;
        } else {
          console.log('[db_helper] Error : you table join options -->' + options)
        }
      }
      JOIN_QUERY += ' JOIN';
      JOIN_QUERY += ' ' + table2 + ' ON ' + on;
    }, // end - join

    /**
     * sqlite3 npm 생성자값을 반환하여 실제 모델에서도 사용할 수 있도록 구현해준다
     */
    sqlite3: function() {
      return db;
    },
  } // return;
};
