package com.cursewlx.maletapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.cursewlx.maletapp.R

class RateWidgetReceiver : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {}

    override fun onEnabled(context: Context) {}

    override fun onDisabled(context: Context) {}

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs: SharedPreferences = context.getSharedPreferences("DATA_SHARED_PREFS", Context.MODE_PRIVATE)
            val rate = prefs.getString("usd_rate", "36.42") ?: "36.42"
            val change = prefs.getString("usd_change", "+0.00%") ?: "+0.00%"
            val isPositive = prefs.getBoolean("usd_is_positive", true)

            val views = RemoteViews(context.packageName, R.layout.rate_widget_layout)
            views.setTextViewText(R.id.app_widget_rate, "Bs $rate")
            views.setTextViewText(R.id.app_widget_change, change)
            
            // Set Color based on change
            val greenColor = 0xFF10B981.toInt()
            val redColor = 0xFFEF4444.toInt()
            views.setTextColor(R.id.app_widget_change, if (isPositive) greenColor else redColor)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
