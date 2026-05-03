package com.ommphysioworld.userapp.data

import org.json.JSONArray
import org.json.JSONObject

typealias JsonMap = Map<String, Any?>

object JsonUtils {
    fun parseObject(raw: String): JsonMap? {
        val value = raw.trim()
        if (value.isEmpty()) {
            return null
        }

        val parsed = JSONObject(value)
        return fromJsonObject(parsed)
    }

    fun parseValue(raw: String): Any? {
        val value = raw.trim()
        if (value.isEmpty()) {
            return null
        }

        return when {
            value.startsWith("{") -> fromJsonObject(JSONObject(value))
            value.startsWith("[") -> fromJsonArray(JSONArray(value))
            else -> value
        }
    }

    fun fromJsonObject(jsonObject: JSONObject): JsonMap {
        val result = linkedMapOf<String, Any?>()
        val keys = jsonObject.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            result[key] = fromJsonValue(jsonObject.opt(key))
        }
        return result
    }

    fun fromJsonArray(jsonArray: JSONArray): List<Any?> {
        return buildList {
            for (index in 0 until jsonArray.length()) {
                add(fromJsonValue(jsonArray.opt(index)))
            }
        }
    }

    fun toJsonString(value: Any?): String {
        return when (val normalized = toJsonValue(value)) {
            is JSONObject -> normalized.toString()
            is JSONArray -> normalized.toString()
            JSONObject.NULL -> ""
            null -> ""
            else -> normalized.toString()
        }
    }

    private fun fromJsonValue(value: Any?): Any? {
        return when (value) {
            null, JSONObject.NULL -> null
            is JSONObject -> fromJsonObject(value)
            is JSONArray -> fromJsonArray(value)
            else -> value
        }
    }

    private fun toJsonValue(value: Any?): Any? {
        return when (value) {
            null -> JSONObject.NULL
            is Map<*, *> -> JSONObject().apply {
                value.forEach { (key, item) ->
                    if (key != null) {
                        put(key.toString(), toJsonValue(item))
                    }
                }
            }

            is List<*> -> JSONArray().apply {
                value.forEach { item ->
                    put(toJsonValue(item))
                }
            }

            is Boolean, is Number, is String -> value
            else -> value.toString()
        }
    }
}

fun Any?.asJsonMap(): JsonMap? = this as? JsonMap

fun Any?.asJsonMapList(): List<JsonMap> {
    val list = this as? List<*> ?: return emptyList()
    return list.mapNotNull { it as? JsonMap }
}

fun JsonMap?.string(key: String): String = this?.get(key)?.toString().orEmpty()

fun JsonMap?.stringOrNull(key: String): String? = this?.get(key)?.toString()?.takeIf { it.isNotBlank() }

fun JsonMap?.map(key: String): JsonMap? = this?.get(key).asJsonMap()

fun JsonMap?.listOfMaps(key: String): List<JsonMap> = this?.get(key).asJsonMapList()

fun JsonMap?.number(key: String): Double = when (val value = this?.get(key)) {
    is Number -> value.toDouble()
    else -> value?.toString()?.toDoubleOrNull() ?: 0.0
}

fun JsonMap?.boolean(key: String): Boolean = when (val value = this?.get(key)) {
    is Boolean -> value
    is Number -> value.toInt() != 0
    is String -> value.equals("true", ignoreCase = true) || value == "1"
    else -> false
}
