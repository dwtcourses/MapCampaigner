var types_value = {};
var typesOptions = '';

function rerenderFunction() {
    // Also render insights function
    var function_form_content = $('#insight-function .function-form').html().trim();
    if (function_form_content.length > 0) {
        return;
    }
    types_value = JSON.parse($("#types").val());
    function_index = 1;
    $('#insight-function .function-form').html('');
    var index = 0;
    var insightsRendered = [];
    $.each(types_value, function (key, value) {
        var type = value['type'];
        var survey = types[type];
        var feature = survey['feature'];
        var tags = survey['tags'];
        if (tags[feature]) {
            feature += '=' + tags[feature]
        }
        var attibutes_on_insights = value['tags'];
        var attributes = {};
        $.each(attibutes_on_insights, function (index, tag) {
            tag = tag.split('[')[0].trim();
            tag = tag.split(': ')[0];
            if (tags[tag]) {
                attributes[tag] = tags[tag];
            } else {
                attributes[tag] = [];
            }
        });

        var default_insights = types[type]['insights'];
        $.each(default_insights, function (insight_index, insight) {
            if ($.inArray(oneTimeFunctions, insightsRendered) === -1) {
                insightsRendered.push(insight);
                $('#insight-function-add').click();
                var row = $('#insight-function .function-form').find('.function-form-row')[index];
                $(row).find('.function-selection').val(insight);
                $(row).find('.function-selection').trigger('change');
                $(row).find('.function-feature').val(feature);
                $(row).find('.function-attributes').val(JSON.stringify(attributes));

                // select type
                $(row).find('.function-type').val(type);
                index += 1;
            }
        });
    });
}
function getTypesSelectionValue() {
    var types_value = {};
    $.each(getSelectedTypes(), function (index, addedType) {
        if (addedType) {
            const idString = '#' + slugify(addedType) + '-feature-tile';
            const $wrapper = $(idString);
            var $tags = $wrapper.find('.row-tags-wrapper').find('.key-tags');
            var tags = [];
            $.each($tags, function (index, value) {
                var tag = $(value).text();
                tags.push($.trim(tag));
            });

            types_value['type-' + (index + 1)] = {
                type: addedType,
                feature: types[addedType]['feature'],
                tags: tags,
                element_type: types[addedType]['element_type']
            }
        }
    });
    return types_value
}

function getSelectedTypes() {
    var uniqueNames = [];
    $('select[name=types_options]').each(function (index, element) {
        var selectedType = $(element).val();
        if ($.inArray(selectedType, uniqueNames) === -1) {
            uniqueNames.push(selectedType);
        }
    });
    return uniqueNames
}
function addMultipleTypes(typeList) {
    $.each(typeList, function (index, type) {
        var selected_type = type['type'];
        addTypes(selected_type);
    });
}
function slugify(string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
  
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

function addTypes(featureName) {
    var template = _.template($("#_template-feature-tile").html());
    var osmFeature = types && types[featureName] ? types[featureName].feature : '';
    var html = template({
        name: featureName,
        slug: slugify(featureName),
        osmFeature
    });
    var row = $("<div/>");
    row.addClass("row");

    var column = $("<div/>");
    column.addClass("col-lg-4");
    column.addClass("form-group");
    column.addClass("type-selection");
    row.append(column);
    row.attr("id","old-dom-el-for-" + slugify(featureName))
    row.hide(); // Keeping `row` because the form depends on it, but hiding it because the user doesn't need to see it

    var select = $("<select />");
    select.addClass('select-types');
    select.attr('id', 'types_options');
    select.attr('name', 'types_options');
    select.html(typesOptions);

    column.append(select);
    select.change(onTypesChange);

    if (featureName) {
        // Add empty value with no default selection
        if (select.find('option[value="' + featureName + '"]').length === 0) {
            column.append('' +
                '<div class="edit-custom-type">' +
                '<i class="fa fa-pencil-square-o" aria-hidden="true" data-toggle="modal" data-target="#custom-types-tags"></i>' +
                '</div>');
            select.prepend('<option value="' + featureName + '">' + featureName + '</option>');
            select.prop("disabled", true);
        }
        select.prepend('<option value="">Select type</option>');
        select.children().removeAttr('selected');
        select.find('option[value="' + featureName + '"]').prop('selected', true);
        select.trigger('change');
    } else {
        // Add empty value with default selection
        select.prepend('<option value="" selected="selected">Select type</option>');
    }

    $("#typesTagsContainer").append(html);
    $("#typesTagsContainer").append(row);
    addTagsToFeature(featureName);
}

function addTagsToFeature(featureName) {
    if (typeof featureName !== 'string') return;
    const hasTagsForFeature = types && types[featureName] && types[featureName]['tags'];
    if (!hasTagsForFeature) return;
    const idString = '#' + slugify(featureName) + '-feature-tile';
    const featureTile = $(idString);
    const featureTags = featureTile.find('.feature-tags');
    const tags = types[featureName]['tags'];
    const tagNames = Object.keys(tags);
    featureTags.empty();
    tagNames.forEach(name => {
        const subtags = tags[name];
        const subtagStr = subtags.length >=1 ? ": " + subtags.join(', ') : '';
        const tagName = name + subtagStr;
        const label = $('<span class="label label-default key-tags" title="' + tagName + '">' + tagName + '</span>');
        featureTags.append(label);
    });
    $('#custom-types-tags').modal('hide');
}

function onTypesChange() {
    $('.types-required-message').hide();
    var selected_type = this.value;
    var row = $(this).parent().parent();
    var row_tags = row.children('.row-tags');
    if (row_tags) row_tags.remove();
    var column = $("<div/>");
    column.addClass("row-tags");
    column.addClass("col-lg-6");
    row.append(column);
    var div = $("<div />");
    div.addClass("row-tags-wrapper");
    var selected_tags;
    if (typeof selected_types_data !== 'undefined') {
        $.each(selected_types_data, function (index, type) {
            if (type['type'] == selected_type) {
                selected_tags = type['tags'];
                if (!types[type['type']]) {
                    addCustomType(type);
                    type['tags'] = undefined;
                }
            }
        });
    }

    if (typeof types !== 'undefined') {
        if (types[selected_type]) {
            var key_tags;
            var tags = types[selected_type]['tags'];
            var key_tags_default = Object.keys(tags);

            if (typeof selected_tags != 'undefined') {
                key_tags = Object.keys(selected_tags);
            } else {
                key_tags = Object.keys(tags);
            }
            for (var j = 0; j < key_tags.length; j++) {
                var tag_string = key_tags[j];
                if (tags[tag_string] && tags[tag_string].length > 0) {
                    tag_string += '<span>: ' + tags[tag_string].join(', ') + '</span>';
                }
                div.append(
                    '<span class="key-tags" style="display: inline-block">' + '<i class="fa fa-times remove-tags" onclick="removeIndividualTag(this, \'' + tag_string + '\')" aria-hidden="true"></i>' + tag_string + ' </span>');
            }

            var select_tag = $("<span />");
            select_tag.addClass('select-tag');
            var span_select = $("<ul />");
            span_select.addClass('additional-key-tags');
            for (var j = 0; j < key_tags_default.length; j++) {
                var tag_string = key_tags_default[j];
                if (tags[tag_string] && tags[tag_string].length > 0) {
                    tag_string += '<span>: ' + tags[tag_string].join(', ') + '</span>';
                }
                span_select.append('<li onclick="addTag(this)">' + tag_string + '</li>')
            }
            select_tag.html(span_select);

            div.append('<div class="btn btn-add-tag" type="button" style="margin-left: 5px;" onclick="onAddTags(this)" onblur="onAddTagsFInish(this)">' +
                '<i class="fa fa-plus" style="font-size: 8pt"></i> Add' + select_tag.html() +
                '</div>' +
                '</span>');
            column.html(div);

            // append to parent
            row.prepend('<div class="row-tags">' +
                '<button class="btn btn-remove-type btn-sm"' +
                'type=button onclick="removeTags(this, \'' + selected_type + '\')">' +
                '<i class="fa fa-minus"></i></button></div>');
        }
    }
    $('#insight-function .function-form').html('');
}

function onAddTags(element) {
    if (!$(element).find('.additional-key-tags').is(":visible")) {
        onAddTagsFInish();
        $(element).find('.additional-key-tags').show();
    } else {
        $('.additional-key-tags').hide();
    }
}
function onAddTagsFInish(element) {
    $('.additional-key-tags').hide();
}
function addTag(wrapper) {
    $('#warning-tag').html('');
    $('#insight-function .function-form').html('');
    var $tagWrapper = $(wrapper).closest('.row-tags-wrapper');
    var spans = $tagWrapper.find("span:contains('" + $(wrapper).text() + "')");
    if (spans.length == 0) {
        $tagWrapper.find('.btn-add-tag').before('' +
            '<span class="key-tags" style="display: inline-block">' + '<i class="fa fa-times remove-tags" style="color: grey" onclick="removeIndividualTag(this, \'' + $(wrapper).text() + '\')" aria-hidden="true"></i>' + $(wrapper).text() + ' </span>')
    } else {
        $('#warning-tag').html('Tag is already selected, please select another.');
    }
}
function removeTags(event, type) {
    $('#' + type + '-feature-tile').remove();
    $('#old-dom-el-for-' + type).remove();
    $('#insight-function .function-form').html('');
    if (types[type]['custom']) {
        delete types[type];
    }
}

function removeIndividualTag(event, type) {
    $(event).parent().remove();
    $('#insight-function .function-form').html('');
}