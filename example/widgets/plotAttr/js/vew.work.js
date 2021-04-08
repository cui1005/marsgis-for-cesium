let thisWidget

//当前页面业务
function initWidgetView(_thisWidget) {
  thisWidget = _thisWidget

  //清除所有标号
  $('#btnDelete').click(function () {
    thisWidget.deleteEntity()
  })

  $('#btnCenter').click(function (e) {
    thisWidget.centerCurrentEntity()
  })

  $('#btn_plot_savefile').click(function () {
    let data = thisWidget.getGeoJson()
    haoutil.file.downloadFile('标绘item.json', JSON.stringify(data))
  })

  plotEdit.initEvent()
  thisWidget.startEditing()
}

//属性编辑相关
var plotEdit = {
  hasEditSylte: true,
  initEvent: function () {
    let that = this
    if (!this.hasEditSylte) {
      $('#attr_style_view').hide()
    }

    //改变高度 - 高程全部设置为
    $('#plot_latlngs_allheight').bind('input propertychange', function () {
      $('#plot_latlngs_addheight').val('')

      let thisval = Number($(this).val()) //高度（米）
      if (isNaN(thisval)) {
        thisval = 1
      }

      let latlngs = []
      $('.plot_latlngs').each(function () {
        if ($(this).attr('data-type') == 'height') {
          $(this).val(thisval)
          latlngs.push(thisval)
        } else {
          latlngs.push(Number($(this).val())) //经纬度值
        }
      })

      thisWidget.updateGeo2map(latlngs, true)
    })

    //改变高度 - 在地表高程偏移
    $('#plot_latlngs_addheight').bind('input propertychange', function () {
      $('#plot_latlngs_allheight').val('')
      let thisval = Number($(this).val()) //高度（米）
      if (isNaN(thisval)) {
        thisval = 1
      }

      let latlngs = []
      $('.plot_latlngs').each(function () {
        if ($(this).attr('data-type') == 'height') {
          let oldval = Number($(this).attr('oldvalue'))
          $(this).val(oldval + thisval)
          latlngs.push(oldval + thisval)
        } else {
          latlngs.push(Number($(this).val())) //经纬度值
        }
      })

      thisWidget.updateGeo2map(latlngs, true)
    })
  },
  _last_attr: null,
  //选中标号，激活属性面板
  startEditing: function (attr, latlngs) {
    if (!thisWidget.attrConfig) {
      return
    }
    if (attr && attr.attr) {
      attr = {
        ...attr,
        ...attr.attr,
      }
    }
    this._last_attr = attr
    let config = thisWidget.attrConfig[attr.edittype || attr.type] || {}
    config.style = config.style || {}

    if (latlngs) {
      this.updateLatlngsHtml(latlngs, config.points)
    }

    let arrFun = []
    let parname, inHtml
    //==============style==================
    if (this.hasEditSylte) {
      parname = 'plot_attr_style_'
      inHtml = '<tr><td class="nametd">类型：</td><td>' + (attr.name || config.name) + '</td></tr>'
      for (let idx = 0; idx < config.style.length; idx++) {
        let edit = config.style[idx]
        if (edit.type == 'hidden') {
          continue
        }
        let attrName = edit.name
        let attrVal = attr.style[attrName] || edit.defval

        //贴地对象
        if (attr.style['clampToGround']) {
          if (
            attrName == 'fill' || //不能取消填充。
            attrName == 'height' || //没有高度
            attrName == 'distanceDisplayCondition' ||
            attrName == 'distanceDisplayCondition_far' ||
            attrName == 'distanceDisplayCondition_near' ||
            attrName == 'outline' ||
            attrName == 'outlineWidth' ||
            attrName == 'outlineColor' ||
            attrName == 'outlineOpacity' ||
            attrName == 'hasShadows' ||
            attrName == 'diffHeight'
          ) {
            continue
          }
        }

        //三维立体对象
        if (attr.style['diffHeight'] > 0) {
          if (attrName == 'clampToGround' || attrName == 'outlineWidth') {
            continue
          }
        }

        let input = this.getAttrInput(parname, attrName, attrVal, edit)
        if (input.fun) {
          arrFun.push({ parname: parname, name: attrName, value: attrVal, edit: edit, fun: input.fun })
        }

        inHtml += '<tr  id="' + parname + 'tr_' + attrName + '" > <td class="nametd">' + edit.label + '</td>  <td>' + input.html + '</td>  </tr>'
      }
      $('#talbe_style').html(inHtml)

      //注记属性
      if (attr.style.label) {
        let configLbl = thisWidget.attrConfig['label'] || {}
        let defStyleLbl = thisWidget.getDefStyle('label') //赋值默认样式

        parname = 'plot_attr_stylelabel_'
        inHtml = ''
        for (let idx = 0; idx < configLbl.style.length; idx++) {
          let edit = configLbl.style[idx]
          if (edit.type == 'hidden') {
            continue
          }

          let attrName = edit.name
          let attrVal = attr.style.label[attrName] || defStyleLbl[attrName]

          let input = this.getAttrInput(parname, attrName, attrVal, edit)
          if (input.fun) {
            arrFun.push({ parname: parname, name: attrName, value: attrVal, edit: edit, fun: input.fun })
          }

          inHtml += '<tr  id="' + parname + 'tr_' + attrName + '" > <td class="nametd">' + edit.label + '</td>  <td>' + input.html + '</td>  </tr>'
        }
        $('#talbe_stylelabel').html(inHtml)
        $('#attr_stylelabel_view').show()
      } else {
        $('#attr_stylelabel_view').hide()
      }
    }
    //==============attr==================
    parname = 'plot_attr_attr_'
    inHtml = ''
    attr.attr = attr.attr || {}
    let attrcfg = thisWidget.getAttrList()
    for (let idx = 0; idx < attrcfg.length; idx++) {
      let edit = attrcfg[idx]
      if (edit.type == 'hidden') {
        continue
      }

      let attrName = edit.name
      let attrVal = attr.attr[attrName] || edit.defval || ''

      let input = this.getAttrInput(parname, attrName, attrVal, edit)
      if (input.fun) {
        arrFun.push({ parname: parname, name: attrName, value: attrVal, edit: edit, fun: input.fun })
      }

      inHtml += '<tr  id="' + parname + 'tr_' + attrName + '" > <td class="nametd">' + edit.label + '</td>  <td>' + input.html + '</td>  </tr>'
    }
    $('#talbe_attr').html(inHtml)

    //执行各方法
    for (let idx = 0; idx < arrFun.length; idx++) {
      let item = arrFun[idx]
      item.fun(item.parname, item.name, item.value, item.edit)
    }

    window.tab2attr() //切换面板
  },
  lastCfg: null,
  updateLatlngsHtml: function (latlngs, cfg) {
    cfg = cfg || this.lastCfg || {}
    this.lastCfg = cfg

    $('#plot_latlngs_addheight').val('')
    $('#plot_latlngs_allheight').val('')
    $('#view_updateheight').hide()

    if (!cfg.hasOwnProperty('height')) {
      cfg.height = true
    }

    //显示坐标信息
    let inHtml = ''
    if (!latlngs || latlngs.length == 0) {
      //
    } else if (latlngs.length == 1) {
      let latlng = latlngs[0]
      let jd = latlng[0]
      let wd = latlng[1]
      let height = latlng.length == 3 ? latlng[2] : 0

      inHtml +=
        ' <div class="mp_attr" style=" margin-top: 10px;"><table>' +
        ' <tr> <td class="nametd">经度：</td> <td><input type="number" class="mp_input plot_latlngs" data-type="jd" step="0.000001"  value="' +
        jd +
        '"></td></tr>' +
        '<tr>  <td class="nametd">纬度：</td> <td><input type="number" class="mp_input plot_latlngs" data-type="wd" step="0.000001"  value="' +
        wd +
        '"></td></tr>'
      if (cfg.height) {
        inHtml +=
          '<tr><td class="nametd">高程：</td> <td><input type="number" class="mp_input plot_latlngs" data-type="height" step="0.1" value="' +
          height +
          '" oldvalue="' +
          height +
          '"></td></tr>'
      }
      inHtml += ' </table> </div>'
    } else {
      if (cfg.height) {
        $('#view_updateheight').show()
      }

      let delhtml = ''

      if (latlngs.length > thisWidget.getMinPointNum()) {
        delhtml = '<i class="fa fa-trash-o latlng-del" title="删除点" ></i>'
      }

      for (let idx = 0; idx < latlngs.length; idx++) {
        let latlng = latlngs[idx]

        let jd = latlng[0]
        let wd = latlng[1]
        let height = latlng.length == 3 ? latlng[2] : 0

        let addthml = ''
        if (latlngs.length < thisWidget.getMaxPointNum()) {
          addthml = '<i class="fa  fa-plus-square-o latlng-install" title="插入点" data-index="' + idx + '" ></i>&nbsp;&nbsp;'
        }

        //
        inHtml +=
          '<div><div class="open"><i class="tree_icon">-</i>第' +
          (idx + 1) +
          '点 <label style="width:100px;">&nbsp;</label>    ' +
          addthml +
          delhtml +
          ' </div><div class="mp_attr"><table>' +
          '<tr> <td class="nametd">经度：</td> <td><input  type="number" class="mp_input plot_latlngs" data-type="jd"  step="0.000001" data-index="' +
          idx +
          '" value="' +
          jd +
          '"></td>  </tr> ' +
          '<tr>  <td class="nametd">纬度：</td> <td><input  type="number" class="mp_input plot_latlngs" data-type="wd"  step="0.000001" data-index="' +
          idx +
          '" value="' +
          wd +
          '"></td> </tr> '
        if (cfg.height) {
          inHtml +=
            '<tr>  <td class="nametd">高程：</td> <td><input  type="number" step="0.1" class="mp_input plot_latlngs" data-type="height" data-index="' +
            idx +
            '" value="' +
            height +
            '" oldvalue="' +
            height +
            '"></td> </tr> '
        }
        inHtml += ' </table> </div> </div>'
      }
    }
    $('#view_latlngs').html(inHtml)
    $('#view_latlngs .open').click(window.changeOpenShowHide)

    let that = this
    $('#view_latlngs .latlng-del').click(function () {
      $(this).parent().parent().remove()

      let latlngs = []
      let withHeight = false
      $('.plot_latlngs').each(function () {
        latlngs.push(Number($(this).val()))
        if ($(this).attr('data-type') === 'height') {
          withHeight = true
        }
      })
      thisWidget.updateGeo2map(latlngs, withHeight)

      //重新修改界面
      let arr = []
      if (withHeight) {
        for (let i = 0; i < latlngs.length; i += 3) {
          arr.push([latlngs[i], latlngs[i + 1], latlngs[i + 2]])
        }
      } else {
        for (let i = 0; i < latlngs.length; i += 2) {
          arr.push([latlngs[i], latlngs[i + 1]])
        }
      }
      that.updateLatlngsHtml(arr)
    })
    $('#view_latlngs .latlng-install').click(function () {
      let idx = Number($(this).attr('data-index'))

      let latlngs = []
      let withHeight = false
      $('.plot_latlngs').each(function () {
        latlngs.push(Number($(this).val()))
        if ($(this).attr('data-type') === 'height') {
          withHeight = true
        }
      })

      //重新修改界面
      let arr = []
      if (withHeight) {
        for (let i = 0; i < latlngs.length; i += 3) {
          arr.push([latlngs[i], latlngs[i + 1], latlngs[i + 2]])
        }
      } else {
        for (let i = 0; i < latlngs.length; i += 2) {
          arr.push([latlngs[i], latlngs[i + 1]])
        }
      }

      let pt1 = arr[idx]
      let pt2 = idx == arr.length - 1 ? arr[0] : arr[idx + 1]
      let jd = Number(((pt1[0] + pt2[0]) / 2).toFixed(6))
      let wd = Number(((pt1[1] + pt2[1]) / 2).toFixed(6))
      if (withHeight) {
        let gd = Number(((pt1[2] + pt2[2]) / 2).toFixed(1))
        arr.splice(idx + 1, 0, [jd, wd, gd])
        latlngs.splice((idx + 1) * 3, 0, jd, wd, gd)
      } else {
        arr.splice(idx + 1, 0, [jd, wd])
        latlngs.splice((idx + 1) * 3, 0, jd, wd)
      }

      that.updateLatlngsHtml(arr)
      thisWidget.updateGeo2map(latlngs, withHeight)
    })

    $('.plot_latlngs').bind('input propertychange', function () {
      let latlngs = []
      let withHeight = false
      $('.plot_latlngs').each(function () {
        latlngs.push(Number($(this).val()))
        if ($(this).attr('data-type') === 'height') {
          withHeight = true
        }
      })
      thisWidget.updateGeo2map(latlngs, withHeight)
    })
  },
  // //单击地图空白，释放属性面板
  // stopEditing: function () {
  //     $("#talbe_style").html('');
  //     $("#talbe_attr").html('');
  //     this._last_attr = null;
  // },
  //获取各属性的编辑html和change方法
  getAttrInput: function (parname, attrName, attrVal, edit) {
    if (attrVal == null || attrVal == undefined) {
      attrVal = ''
    }

    let that = this

    let inHtml = ''
    let fun = null
    switch (edit.type) {
      default:
      case 'label':
        inHtml = attrVal
        break
      case 'text':
        inHtml = '<input id="' + parname + attrName + '" type="text" value="' + attrVal + '"   class="mp_input" />'

        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).on('input propertychange', function (e) {
            let attrVal = $(this).val()
            that.updateAttr(parname, attrName, attrVal)
          })
        }
        break
      case 'textarea':
        attrVal = attrVal.replace(new RegExp('<br />', 'gm'), '\n')
        inHtml = '<textarea  id="' + parname + attrName + '"     class="mp_input" style="height:50px;resize: none;" >' + attrVal + '</textarea>'

        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).on('input propertychange', function (e) {
            let attrVal = $(this).val()
            if (attrVal.length == 0) {
              attrVal = '文字'
            }
            attrVal = attrVal.replace(/\n/g, '<br />')

            that.updateAttr(parname, attrName, attrVal)
          })
        }
        break
      case 'number':
        inHtml = '<input id="' + parname + attrName + '" type="number" value="' + (attrVal || 0) + '"    class="mp_input"/>'
        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).on('input propertychange', function (e) {
            let attrVal = Number($(this).val())

            that.updateAttr(parname, attrName, attrVal)
          })
        }
        break

      case 'combobox':
        inHtml = '<select id="' + parname + attrName + '" class="mp_select"    data-value="' + attrVal + '" >'
        for (let jj = 0; jj < edit.data.length; jj++) {
          let temp = edit.data[jj]
          inHtml += '<option value="' + temp.value + '">' + temp.text + '</option>'
        }
        inHtml += '</select>'

        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).select() //绑定样式
          $('#' + parname + attrName).change(function () {
            let attrVal = $(this).attr('data-value')

            that.updateAttr(parname, attrName, attrVal)

            for (let jj = 0; jj < edit.data.length; jj++) {
              let temp = edit.data[jj]
              if (temp.impact == null) {
                continue
              }
              that.changeViewByAttr(parname, temp.impact, temp.value === attrVal)
            }
          })

          for (let jj = 0; jj < edit.data.length; jj++) {
            let temp = edit.data[jj]
            if (temp.impact == null) {
              continue
            }
            that.changeViewByAttr(parname, temp.impact, temp.value === attrVal)
          }
        }
        break

      case 'radio':
        {
          let _name_key = parname + attrName
          inHtml = `<div class="radio radio-info radio-inline">
            <input type="radio" id="${_name_key}_1" value="1"  name="${_name_key}" ${attrVal ? 'checked="checked"' : ''}>
            <label for="${_name_key}_1"> 是</label>
          </div>
          <div class="radio radio-info radio-inline">
            <input type="radio" id="${_name_key}_0" value="0" name="${_name_key}" ${attrVal ? '' : 'checked="checked"'}">
            <label for="${_name_key}_0"> 否 </label>
          </div>`

          fun = function (parname, attrName, attrVal, edit) {
            $('input:radio[name="' + parname + attrName + '"]').change(function () {
              let attrVal = $(this).val() == '1'
              that.updateAttr(parname, attrName, attrVal)

              that.changeViewByAttr(parname, edit.impact, attrVal)
            })
            that.changeViewByAttr(parname, edit.impact, attrVal)
          }
        }
        break
      case 'color':
        inHtml = '<input id="' + parname + attrName + '"  class="mp_input" style="width: 100%;"  value="' + attrVal + '" />'

        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).minicolors({
            position: 'bottom right',
            control: 'saturation',
            change: function (hex, opacity) {
              that.updateAttr(parname, attrName, hex)
            },
          })
        }
        break
      case 'slider':
        inHtml = '<input id="' + parname + attrName + '"  type="text" value="' + attrVal * 100 + '" />'
        fun = function (parname, attrName, attrVal, edit) {
          let _width = $('.mp_tab_card').width() * 0.7 - 30
          $('#' + parname + attrName).progress(_width) //绑定样式
          $('#' + parname + attrName).change(function () {
            let attrVal = Number($(this).val()) / 100

            that.updateAttr(parname, attrName, attrVal)
          })
        }
        break
      case 'window':
        inHtml = '<input id="' + parname + attrName + '" type="text" value="' + attrVal + '" readonly   class="mp_input" />'

        fun = function (parname, attrName, attrVal, edit) {
          $('#' + parname + attrName).on('click', function (e) {
            thisWidget.showEditAttrWindow({
              data: that._last_attr,
              parname: parname,
              attrName: attrName,
              attrVal: attrVal,
            })
          })

          $('#' + parname + attrName).on('input propertychange', function (e) {
            let attrVal = $(this).val()
            that.updateAttr(parname, attrName, attrVal)
          })
        }
        break
    }
    return { html: inHtml, fun: fun }
  },
  //联动属性控制
  changeViewByAttr: function (parname, arrimpact, show) {
    if (arrimpact && arrimpact.length > 0) {
      for (let jj = 0; jj < arrimpact.length; jj++) {
        let attrName = arrimpact[jj]
        if (show) {
          $('#' + parname + 'tr_' + attrName).show()
        } else {
          $('#' + parname + 'tr_' + attrName).hide()
        }
      }
    }
  },
  //属性面板值修改后触发此方法
  updateAttr: function (parname, attrName, attrVal) {
    switch (parname) {
      default:
        break
      case 'plot_attr_style_': {
        this._last_attr.style[attrName] = attrVal

        let type = this._last_attr.type
        if (
          (attrName == 'fill' || attrName == 'outline') &&
          attrVal === false &&
          (type == 'plane' ||
            type == 'circle' ||
            type == 'ellipse' ||
            type == 'cylinder' ||
            type == 'ellipsoid' ||
            type == 'box' ||
            type == 'polylineVolume' ||
            type == 'wall' ||
            type == 'corridor' ||
            type == 'rectangle' ||
            type == 'polygon')
        ) {
          if (!this._last_attr.style['fill'] && !this._last_attr.style['outline']) {
            this._last_attr.style[attrName] = true
            $("input[name='" + parname + attrName + "']:eq(0)").attr('checked', 'checked')
            $("input[name='" + parname + attrName + "']:eq(0)").click()
            haoutil.msg('填充和边框不能同时为否，需要至少开启一个！')
            return
          }
        }

        break
      }
      case 'plot_attr_stylelabel_':
        this._last_attr.style.label = this._last_attr.style.label || {}
        this._last_attr.style.label[attrName] = attrVal
        break
      case 'plot_attr_attr_':
        this._last_attr.attr[attrName] = attrVal
        //this.startEditing(this._last_attr);
        break
    }
    thisWidget.updateAttr2map(this._last_attr)
  },
}
