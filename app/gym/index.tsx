import { router } from 'expo-router';
import { ChevronRight, Dumbbell, History, ListChecks, Play, Ruler, TrendingUp } from 'lucide-react-native';
import { Fragment, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    formatAdherence,
    formatVolume,
    formatWeight,
    formatWorkoutDate,
    formatDuration,
    notify,
} from '@/components/gym/format';
import {
    DAY_LABELS,
    GYM_SESSION_STATUS_LABELS,
    isoDayOfWeek,
    sessionVolume,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

/**
 * Inicio del gimnasio: activa el módulo si aún no lo está y, una vez dentro,
 * muestra el resumen del mes, la rutina de hoy y los últimos entrenamientos.
 */
export default function GymHomeScreen() {
    const gymEnabled = useGymStore((s) => s.gymEnabled);
    const modulesLoading = useGymStore((s) => s.modulesLoading);
    const summary = useGymStore((s) => s.summary);
    const activeRoutine = useGymStore((s) => s.activeRoutine);
    const sessions = useGymStore((s) => s.sessions);
    const latestMetric = useGymStore((s) => s.latestMetric);
    const reportsLoading = useGymStore((s) => s.reportsLoading);

    const loadModules = useGymStore((s) => s.loadModules);
    const loadActiveRoutine = useGymStore((s) => s.loadActiveRoutine);
    const loadReports = useGymStore((s) => s.loadReports);
    const loadSessions = useGymStore((s) => s.loadSessions);
    const loadLatestMetric = useGymStore((s) => s.loadLatestMetric);
    const setGymEnabled = useGymStore((s) => s.setGymEnabled);

    const [enabling, setEnabling] = useState(false);

    // El estado del módulo decide si se muestra el contenido o el gate.
    useEffect(() => {
        void loadModules();
    }, [loadModules]);

    useEffect(() => {
        if (!gymEnabled) return;

        void loadActiveRoutine();
        void loadReports();
        void loadSessions({ refresh: true });
        void loadLatestMetric();
    }, [gymEnabled, loadActiveRoutine, loadReports, loadSessions, loadLatestMetric]);

    const enable = async () => {
        setEnabling(true);
        const error = await setGymEnabled(true);
        setEnabling(false);

        if (error) {
            notify('error', error);
            return;
        }
        notify('success', '¡Gimnasio activado!');
    };

    const today = isoDayOfWeek();
    const todayPlan = activeRoutine?.days?.find((day) => day.day_of_week === today) ?? null;
    const isRest = todayPlan?.is_rest === true;
    const exerciseCount = todayPlan?.exercises.length ?? 0;
    const loading = modulesLoading || (gymEnabled && reportsLoading && !summary);

    const train = () => {
        if (!todayPlan?.id) return;
        router.push({
            pathname: '/gym/workout',
            params: { day: todayPlan.id },
        } as any);
    };

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader title="Gimnasio" subtitle="Tu rutina y tu progreso" />

                {loading ? (
                    <SkeletonShimmer style={styles.skeleton}>
                        <SkeletonBlock h={112} r={16} />
                        <SkeletonBlock h={132} r={16} />
                        <SkeletonBlock h={84} r={16} />
                        <SkeletonBlock h={84} r={16} />
                    </SkeletonShimmer>
                ) : !gymEnabled ? (
                    <View style={styles.enableCard}>
                        <View style={styles.enableIcon}>
                            <Dumbbell size={26} color="#111" />
                        </View>
                        <TextMalet style={styles.enableTitle}>Activa el Gimnasio</TextMalet>
                        <TextMalet style={styles.enableText}>
                            Rutina semanal de lunes a domingo, registro de entrenamientos,
                            récords y progreso. Es un módulo opcional: solo lo ves tú.
                        </TextMalet>
                        <Button
                            text="Activar Gimnasio"
                            onPress={enable}
                            loading={enabling}
                            style={styles.enableBtn}
                        />
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Resumen del mes */}
                        <View style={styles.statsGrid}>
                            <Stat
                                label="Entrenos"
                                value={summary ? String(summary.sessions_count) : '—'}
                                hint="Últimos 30 días"
                            />
                            <Stat
                                label="Volumen"
                                value={summary ? formatVolume(summary.total_volume) : '—'}
                                hint="Peso total movido"
                            />
                            <Stat
                                label="Adherencia"
                                value={summary ? formatAdherence(summary.adherence) : '—'}
                                hint="Plan vs. hecho"
                            />
                            <Stat
                                label="Días"
                                value={summary ? String(summary.training_days) : '—'}
                                hint="Con entrenamiento"
                            />
                        </View>

                        {/* Hoy */}
                        <View style={styles.todayCard}>
                            <TextMalet style={styles.todayLabel}>{DAY_LABELS[today]}</TextMalet>

                            {!activeRoutine ? (
                                <Fragment>
                                    <TextMalet style={styles.todayTitle}>Sin rutina activa</TextMalet>
                                    <TextMalet style={styles.todayText}>
                                        Crea una rutina y actívala para empezar a entrenar.
                                    </TextMalet>
                                </Fragment>
                            ) : isRest ? (
                                <Fragment>
                                    <TextMalet style={styles.todayTitle}>Día de descanso</TextMalet>
                                    <TextMalet style={styles.todayText}>
                                        {todayPlan?.title ?? 'Recupera para el siguiente entrenamiento.'}
                                    </TextMalet>
                                </Fragment>
                            ) : todayPlan ? (
                                <Fragment>
                                    <TextMalet style={styles.todayTitle}>
                                        {todayPlan.title ?? activeRoutine.name}
                                    </TextMalet>
                                    <TextMalet style={styles.todayText}>
                                        {exerciseCount}{' '}
                                        {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'} planificados
                                    </TextMalet>
                                    <Button
                                        text="Entrenar"
                                        icon={<Play size={14} color="#fff" />}
                                        onPress={train}
                                        style={styles.trainBtn}
                                    />
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <TextMalet style={styles.todayTitle}>Sin plan para hoy</TextMalet>
                                    <TextMalet style={styles.todayText}>
                                        Tu rutina activa no tiene ejercicios para {DAY_LABELS[today]}.
                                    </TextMalet>
                                </Fragment>
                            )}
                        </View>

                        {/* Accesos del módulo */}
                        <View style={styles.linksRow}>
                            <TouchableOpacity
                                style={styles.linkCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/gym/routines' as any)}
                            >
                                <ListChecks size={18} color="#111" />
                                <TextMalet style={styles.linkLabel}>Rutinas</TextMalet>
                                <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/gym/exercises' as any)}
                            >
                                <Dumbbell size={18} color="#111" />
                                <TextMalet style={styles.linkLabel}>Ejercicios</TextMalet>
                                <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/gym/history' as any)}
                            >
                                <History size={18} color="#111" />
                                <TextMalet style={styles.linkLabel}>Historial</TextMalet>
                                <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/gym/progress' as any)}
                            >
                                <TrendingUp size={18} color="#111" />
                                <TextMalet style={styles.linkLabel}>Progreso</TextMalet>
                                <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/gym/measurements' as any)}
                            >
                                <Ruler size={18} color="#111" />
                                <TextMalet style={styles.linkLabel}>Medidas</TextMalet>
                                <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                            </TouchableOpacity>
                        </View>

                        {/* Última medida */}
                        {latestMetric ? (
                            <View style={styles.measureCard}>
                                <View style={styles.measureLeft}>
                                    <TextMalet style={styles.measureLabel}>Última medida</TextMalet>
                                    <TextMalet style={styles.measureDate}>
                                        {formatWorkoutDate(latestMetric.date)}
                                    </TextMalet>
                                </View>
                                <View style={styles.measureRight}>
                                    <TextMalet style={styles.measureValue}>
                                        {formatWeight(latestMetric.weight_kg)}
                                    </TextMalet>
                                    {latestMetric.bmi != null ? (
                                        <TextMalet style={styles.measureHint}>
                                            IMC {latestMetric.bmi}
                                        </TextMalet>
                                    ) : null}
                                </View>
                            </View>
                        ) : null}

                        {/* Últimos entrenamientos */}
                        <TextMalet style={styles.sectionTitle}>Últimos entrenamientos</TextMalet>

                        {sessions.length === 0 ? (
                            <TextMalet style={styles.emptyText}>
                                Aún no registras entrenamientos.
                            </TextMalet>
                        ) : (
                            sessions.slice(0, 3).map((session) => (
                                <View key={session.id} style={styles.sessionRow}>
                                    <View style={styles.sessionLeft}>
                                        <TextMalet style={styles.sessionDate}>
                                            {formatWorkoutDate(session.date)}
                                        </TextMalet>
                                        <TextMalet style={styles.sessionSub}>
                                            {GYM_SESSION_STATUS_LABELS[session.status]}
                                            {session.duration_minutes
                                                ? ` · ${formatDuration(session.duration_minutes)}`
                                                : ''}
                                        </TextMalet>
                                    </View>
                                    <TextMalet style={styles.sessionVolume}>
                                        {formatVolume(sessionVolume(session))}
                                    </TextMalet>
                                </View>
                            ))
                        )}

                        <View style={{ height: 32 }} />
                    </ScrollView>
                )}
            </View>
        </LayoutAuthenticated>
    );
}

/** Celda del resumen. */
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <View style={styles.statCard}>
            <TextMalet style={styles.statLabel}>{label}</TextMalet>
            <TextMalet style={styles.statValue} numberOfLines={1}>
                {value}
            </TextMalet>
            <TextMalet style={styles.statHint} numberOfLines={1}>
                {hint}
            </TextMalet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    scrollContent: {
        gap: 14,
        paddingBottom: 40,
    },
    skeleton: {
        gap: 12,
    },
    // Gate del módulo
    enableCard: {
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 20,
        padding: 22,
        marginTop: 8,
    },
    enableIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    enableTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    enableText: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.5)',
        textAlign: 'center',
        lineHeight: 19,
    },
    enableBtn: {
        marginTop: 6,
    },
    // Resumen
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        letterSpacing: -0.4,
    },
    statHint: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.4)',
    },
    // Hoy
    todayCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 18,
        gap: 4,
    },
    todayLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    todayTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.3,
    },
    todayText: {
        fontSize: 12.5,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 18,
    },
    trainBtn: {
        alignSelf: 'flex-start',
        marginTop: 10,
        backgroundColor: '#fff',
    },
    // Medida
    linksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    linkCard: {
        flexBasis: '48%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    linkLabel: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    measureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    measureLeft: {
        gap: 2,
    },
    measureLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
    measureDate: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
    },
    measureRight: {
        alignItems: 'flex-end',
        gap: 1,
    },
    measureValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    measureHint: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.4)',
    },
    // Sesiones
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    emptyText: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    sessionLeft: {
        flex: 1,
        gap: 1,
    },
    sessionDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    sessionSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    sessionVolume: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111',
    },
});
